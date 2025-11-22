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
     */
    private function scan_client_side($url, $options) {
        // Return placeholder - actual scanning happens in browser
        return [
            'url' => $url,
            'score' => 0,
            'violations' => [],
            'passes' => [],
            'incomplete' => [],
            'client_side' => true,
            'message' => __('Configure API key for server-side scanning', 'accessibility-everywhere'),
        ];
    }

    /**
     * Scan post content HTML
     */
    public function scan_html($html, $options = []) {
        // This would integrate with axe-core via JavaScript
        // For now, return placeholder
        return [
            'score' => 0,
            'violations' => [],
            'message' => __('Use scan_url for full page scanning', 'accessibility-everywhere'),
        ];
    }
}
