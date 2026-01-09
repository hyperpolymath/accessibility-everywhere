<?php
/**
 * Scanner class
 */
class A11Y_Scanner {
    /**
     * Scan a URL for accessibility issues
     */
    public function scan_url($url, $options = []) {
        $defaults = [
            'wcag_level' => get_option('a11y_settings')['wcag_level'] ?? 'AA',
            'screenshot' => false,
        ];

        $options = wp_parse_args($options, $defaults);

        // Use API if key provided
        $settings = get_option('a11y_settings', []);
        if (!empty($settings['api_key'])) {
            return $this->scan_via_api($url, $options);
        }

        // Otherwise use client-side scanning
        return $this->scan_client_side($url, $options);
    }

    /**
     * Scan via API
     */
    private function scan_via_api($url, $options) {
        $settings = get_option('a11y_settings', []);

        $response = wp_remote_post(A11Y_API_BASE . '/scan', [
            'headers' => [
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $settings['api_key'],
            ],
            'body' => json_encode([
                'url' => $url,
                'wcagLevel' => $options['wcag_level'],
                'screenshot' => $options['screenshot'],
            ]),
            'timeout' => 30,
        ]);

        if (is_wp_error($response)) {
            return $response;
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);

        if (empty($body['success'])) {
            return new WP_Error('scan_failed', $body['error']['message'] ?? __('Scan failed', 'accessibility-everywhere'));
        }

        return $body['data'];
    }

    /**
     * Client-side scanning (requires JavaScript)
     *
     * Returns configuration for browser-based axe-core scanning.
     * The actual scan is performed by JavaScript using the axe-core library.
     *
     * @param string $url The URL to scan.
     * @param array $options Scan options.
     * @return array Scan configuration for client-side execution.
     */
    private function scan_client_side($url, $options) {
        // Generate a unique scan ID for tracking
        $scan_id = wp_generate_uuid4();

        // Store pending scan in transient for JS callback
        set_transient('a11y_pending_scan_' . $scan_id, [
            'url' => $url,
            'options' => $options,
            'started' => current_time('mysql'),
        ], HOUR_IN_SECONDS);

        // Return configuration for client-side scanning
        return [
            'url' => $url,
            'scan_id' => $scan_id,
            'client_side' => true,
            'config' => [
                'wcag_level' => $options['wcag_level'],
                'rules' => $this->get_wcag_rules($options['wcag_level']),
                'callback_url' => rest_url('accessibility-everywhere/v1/scan-complete'),
                'nonce' => wp_create_nonce('a11y_scan_complete'),
            ],
            'message' => __('Scan initiated. Results will be processed via axe-core in browser.', 'accessibility-everywhere'),
        ];
    }

    /**
     * Get WCAG rules for the specified level.
     *
     * @param string $level WCAG level (A, AA, or AAA).
     * @return array Array of rule tags to check.
     */
    private function get_wcag_rules($level) {
        $rules = ['wcag2a', 'wcag21a', 'wcag22a', 'best-practice'];

        if ($level === 'AA' || $level === 'AAA') {
            $rules = array_merge($rules, ['wcag2aa', 'wcag21aa', 'wcag22aa']);
        }

        if ($level === 'AAA') {
            $rules = array_merge($rules, ['wcag2aaa', 'wcag21aaa', 'wcag22aaa']);
        }

        return $rules;
    }

    /**
     * Scan post content HTML for accessibility issues.
     *
     * Performs server-side HTML analysis for common accessibility violations.
     * This is a lightweight check that catches obvious issues without requiring
     * a full browser-based axe-core scan.
     *
     * @param string $html The HTML content to scan.
     * @param array $options Scan options.
     * @return array Scan results with violations and score.
     */
    public function scan_html($html, $options = []) {
        $violations = [];
        $passes = [];

        // Load HTML into DOMDocument for analysis
        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML('<?xml encoding="utf-8" ?>' . $html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();

        $xpath = new DOMXPath($dom);

        // Check for images without alt attributes
        $images = $xpath->query('//img[not(@alt)]');
        if ($images->length > 0) {
            $nodes = [];
            foreach ($images as $img) {
                $nodes[] = [
                    'html' => $dom->saveHTML($img),
                    'target' => $this->get_selector($img),
                ];
            }
            $violations[] = [
                'id' => 'image-alt',
                'impact' => 'critical',
                'description' => __('Images must have alternate text', 'accessibility-everywhere'),
                'help' => __('Ensures <img> elements have alternate text or a role of none or presentation', 'accessibility-everywhere'),
                'helpUrl' => 'https://dequeuniversity.com/rules/axe/4.6/image-alt',
                'wcag' => ['wcag2a', 'wcag111'],
                'nodes' => $nodes,
            ];
        } else {
            $passes[] = ['id' => 'image-alt', 'description' => __('All images have alt text', 'accessibility-everywhere')];
        }

        // Check for empty links
        $empty_links = $xpath->query('//a[not(normalize-space(text())) and not(.//img[@alt]) and not(@aria-label) and not(@aria-labelledby)]');
        if ($empty_links->length > 0) {
            $nodes = [];
            foreach ($empty_links as $link) {
                $nodes[] = [
                    'html' => $dom->saveHTML($link),
                    'target' => $this->get_selector($link),
                ];
            }
            $violations[] = [
                'id' => 'link-name',
                'impact' => 'serious',
                'description' => __('Links must have discernible text', 'accessibility-everywhere'),
                'help' => __('Ensures links have discernible text', 'accessibility-everywhere'),
                'helpUrl' => 'https://dequeuniversity.com/rules/axe/4.6/link-name',
                'wcag' => ['wcag2a', 'wcag412'],
                'nodes' => $nodes,
            ];
        } else {
            $passes[] = ['id' => 'link-name', 'description' => __('All links have accessible names', 'accessibility-everywhere')];
        }

        // Check for empty buttons
        $empty_buttons = $xpath->query('//button[not(normalize-space(text())) and not(@aria-label) and not(@aria-labelledby) and not(@title)]');
        if ($empty_buttons->length > 0) {
            $nodes = [];
            foreach ($empty_buttons as $btn) {
                $nodes[] = [
                    'html' => $dom->saveHTML($btn),
                    'target' => $this->get_selector($btn),
                ];
            }
            $violations[] = [
                'id' => 'button-name',
                'impact' => 'critical',
                'description' => __('Buttons must have discernible text', 'accessibility-everywhere'),
                'help' => __('Ensures buttons have discernible text', 'accessibility-everywhere'),
                'helpUrl' => 'https://dequeuniversity.com/rules/axe/4.6/button-name',
                'wcag' => ['wcag2a', 'wcag412'],
                'nodes' => $nodes,
            ];
        } else {
            $passes[] = ['id' => 'button-name', 'description' => __('All buttons have accessible names', 'accessibility-everywhere')];
        }

        // Check for form inputs without labels
        $inputs_without_labels = $xpath->query('//input[@type!="hidden" and @type!="submit" and @type!="button" and @type!="image" and not(@aria-label) and not(@aria-labelledby)]');
        $labeled_inputs = [];
        foreach ($inputs_without_labels as $input) {
            $id = $input->getAttribute('id');
            if ($id) {
                $label = $xpath->query('//label[@for="' . $id . '"]');
                if ($label->length > 0) {
                    $labeled_inputs[] = $input;
                    continue;
                }
            }
            // Check if input is wrapped in label
            $parent_label = $xpath->query('ancestor::label', $input);
            if ($parent_label->length > 0) {
                $labeled_inputs[] = $input;
            }
        }

        $unlabeled_count = $inputs_without_labels->length - count($labeled_inputs);
        if ($unlabeled_count > 0) {
            $nodes = [];
            foreach ($inputs_without_labels as $input) {
                if (!in_array($input, $labeled_inputs, true)) {
                    $nodes[] = [
                        'html' => $dom->saveHTML($input),
                        'target' => $this->get_selector($input),
                    ];
                }
            }
            if (!empty($nodes)) {
                $violations[] = [
                    'id' => 'label',
                    'impact' => 'critical',
                    'description' => __('Form elements must have labels', 'accessibility-everywhere'),
                    'help' => __('Ensures every form element has a label', 'accessibility-everywhere'),
                    'helpUrl' => 'https://dequeuniversity.com/rules/axe/4.6/label',
                    'wcag' => ['wcag2a', 'wcag412', 'wcag131'],
                    'nodes' => $nodes,
                ];
            }
        } else {
            $passes[] = ['id' => 'label', 'description' => __('All form inputs have labels', 'accessibility-everywhere')];
        }

        // Check for heading hierarchy issues
        $headings = $xpath->query('//h1|//h2|//h3|//h4|//h5|//h6');
        $heading_levels = [];
        foreach ($headings as $heading) {
            $level = (int) substr($heading->nodeName, 1);
            $heading_levels[] = $level;
        }

        $heading_issues = [];
        for ($i = 1; $i < count($heading_levels); $i++) {
            if ($heading_levels[$i] > $heading_levels[$i - 1] + 1) {
                $heading_issues[] = sprintf(
                    __('Skipped from h%d to h%d', 'accessibility-everywhere'),
                    $heading_levels[$i - 1],
                    $heading_levels[$i]
                );
            }
        }

        if (!empty($heading_issues)) {
            $violations[] = [
                'id' => 'heading-order',
                'impact' => 'moderate',
                'description' => __('Heading levels should increase by one', 'accessibility-everywhere'),
                'help' => __('Ensures the order of headings is semantically correct', 'accessibility-everywhere'),
                'helpUrl' => 'https://dequeuniversity.com/rules/axe/4.6/heading-order',
                'wcag' => ['wcag2a', 'wcag131'],
                'nodes' => [['issues' => $heading_issues]],
            ];
        } else {
            $passes[] = ['id' => 'heading-order', 'description' => __('Heading hierarchy is correct', 'accessibility-everywhere')];
        }

        // Calculate score based on violations
        $score = $this->calculate_score($violations, $passes);

        return [
            'score' => $score,
            'violations' => $violations,
            'passes' => $passes,
            'scanned_at' => current_time('mysql'),
            'method' => 'server-side',
        ];
    }

    /**
     * Calculate accessibility score based on violations and passes.
     *
     * @param array $violations Array of violations found.
     * @param array $passes Array of passed checks.
     * @return int Score from 0-100.
     */
    private function calculate_score($violations, $passes) {
        $total_checks = count($violations) + count($passes);
        if ($total_checks === 0) {
            return 100;
        }

        // Weight by impact
        $impact_weights = [
            'critical' => 25,
            'serious' => 15,
            'moderate' => 7,
            'minor' => 3,
        ];

        $penalty = 0;
        foreach ($violations as $violation) {
            $impact = $violation['impact'] ?? 'moderate';
            $weight = $impact_weights[$impact] ?? 7;
            $node_count = isset($violation['nodes']) ? count($violation['nodes']) : 1;
            $penalty += $weight * min($node_count, 5); // Cap node multiplier at 5
        }

        $max_score = 100;
        $score = max(0, $max_score - $penalty);

        return (int) $score;
    }

    /**
     * Generate a CSS selector for a DOM node.
     *
     * @param DOMNode $node The DOM node.
     * @return string CSS selector.
     */
    private function get_selector($node) {
        $selector = $node->nodeName;

        if ($node->hasAttribute('id')) {
            return '#' . $node->getAttribute('id');
        }

        if ($node->hasAttribute('class')) {
            $classes = explode(' ', $node->getAttribute('class'));
            $classes = array_filter($classes);
            if (!empty($classes)) {
                $selector .= '.' . implode('.', array_slice($classes, 0, 2));
            }
        }

        return $selector;
    }
}
