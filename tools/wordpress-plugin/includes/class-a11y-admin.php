<?php
/**
 * Admin interface class
 */
class A11Y_Admin {
    /**
     * Add admin menu
     */
    public function add_menu() {
        add_menu_page(
            __('Accessibility', 'accessibility-everywhere'),
            __('Accessibility', 'accessibility-everywhere'),
            'manage_options',
            'accessibility-everywhere',
            [$this, 'admin_page'],
            'dashicons-universal-access',
            30
        );

        add_submenu_page(
            'accessibility-everywhere',
            __('Settings', 'accessibility-everywhere'),
            __('Settings', 'accessibility-everywhere'),
            'manage_options',
            'accessibility-everywhere-settings',
            [$this, 'settings_page']
        );
    }

    /**
     * Enqueue admin scripts
     */
    public function enqueue_scripts($hook) {
        if (strpos($hook, 'accessibility-everywhere') === false) {
            return;
        }

        wp_enqueue_style(
            'a11y-admin',
            A11Y_PLUGIN_URL . 'assets/css/admin.css',
            [],
            A11Y_VERSION
        );

        wp_enqueue_script(
            'a11y-admin',
            A11Y_PLUGIN_URL . 'assets/js/admin.js',
            ['jquery'],
            A11Y_VERSION,
            true
        );

        wp_localize_script('a11y-admin', 'a11yData', [
            'apiUrl' => rest_url('accessibility-everywhere/v1'),
            'nonce' => wp_create_nonce('wp_rest'),
        ]);
    }

    /**
     * Main admin page
     */
    public function admin_page() {
        ?>
        <div class="wrap">
            <h1><?php _e('Accessibility Overview', 'accessibility-everywhere'); ?></h1>

            <div class="a11y-dashboard">
                <div class="a11y-card">
                    <h2><?php _e('Site Score', 'accessibility-everywhere'); ?></h2>
                    <div class="a11y-score-circle">
                        <span class="a11y-score-value" id="a11y-site-score">--</span>
                    </div>
                    <p><?php _e('Average accessibility score across all pages', 'accessibility-everywhere'); ?></p>
                    <button class="button button-primary" id="a11y-scan-site">
                        <?php _e('Scan Entire Site', 'accessibility-everywhere'); ?>
                    </button>
                </div>

                <div class="a11y-card">
                    <h2><?php _e('Recent Scans', 'accessibility-everywhere'); ?></h2>
                    <div id="a11y-recent-scans">
                        <?php $this->render_recent_scans(); ?>
                    </div>
                </div>

                <div class="a11y-card">
                    <h2><?php _e('Common Violations', 'accessibility-everywhere'); ?></h2>
                    <div id="a11y-common-violations">
                        <?php $this->render_common_violations(); ?>
                    </div>
                </div>

                <div class="a11y-card">
                    <h2><?php _e('Quick Scan', 'accessibility-everywhere'); ?></h2>
                    <p><?php _e('Enter a URL to scan immediately:', 'accessibility-everywhere'); ?></p>
                    <input type="url" id="a11y-quick-scan-url" class="regular-text" placeholder="https://example.com">
                    <button class="button" id="a11y-quick-scan-btn">
                        <?php _e('Scan', 'accessibility-everywhere'); ?>
                    </button>
                    <div id="a11y-quick-scan-results"></div>
                </div>
            </div>
        </div>
        <?php
    }

    /**
     * Settings page
     */
    public function settings_page() {
        if (!current_user_can('manage_options')) {
            return;
        }

        // Save settings
        if (isset($_POST['a11y_settings_nonce']) && wp_verify_nonce($_POST['a11y_settings_nonce'], 'a11y_save_settings')) {
            $settings = [
                'auto_scan' => isset($_POST['auto_scan']),
                'wcag_level' => sanitize_text_field($_POST['wcag_level']),
                'min_score' => intval($_POST['min_score']),
                'api_key' => sanitize_text_field($_POST['api_key']),
            ];

            update_option('a11y_settings', $settings);
            echo '<div class="notice notice-success"><p>' . __('Settings saved.', 'accessibility-everywhere') . '</p></div>';
        }

        $settings = get_option('a11y_settings', []);
        ?>
        <div class="wrap">
            <h1><?php _e('Accessibility Settings', 'accessibility-everywhere'); ?></h1>

            <form method="post" action="">
                <?php wp_nonce_field('a11y_save_settings', 'a11y_settings_nonce'); ?>

                <table class="form-table">
                    <tr>
                        <th scope="row"><?php _e('Auto-Scan on Publish', 'accessibility-everywhere'); ?></th>
                        <td>
                            <label>
                                <input type="checkbox" name="auto_scan" value="1" <?php checked(!empty($settings['auto_scan'])); ?>>
                                <?php _e('Automatically scan posts when publishing', 'accessibility-everywhere'); ?>
                            </label>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><?php _e('WCAG Level', 'accessibility-everywhere'); ?></th>
                        <td>
                            <select name="wcag_level">
                                <option value="A" <?php selected($settings['wcag_level'] ?? 'AA', 'A'); ?>>Level A</option>
                                <option value="AA" <?php selected($settings['wcag_level'] ?? 'AA', 'AA'); ?>>Level AA</option>
                                <option value="AAA" <?php selected($settings['wcag_level'] ?? 'AA', 'AAA'); ?>>Level AAA</option>
                            </select>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><?php _e('Minimum Score', 'accessibility-everywhere'); ?></th>
                        <td>
                            <input type="number" name="min_score" value="<?php echo esc_attr($settings['min_score'] ?? 70); ?>" min="0" max="100" class="small-text">
                            <p class="description"><?php _e('Warn if score falls below this value (0 to disable)', 'accessibility-everywhere'); ?></p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><?php _e('API Key', 'accessibility-everywhere'); ?></th>
                        <td>
                            <input type="text" name="api_key" value="<?php echo esc_attr($settings['api_key'] ?? ''); ?>" class="regular-text">
                            <p class="description">
                                <?php _e('Optional. Get your API key from', 'accessibility-everywhere'); ?>
                                <a href="https://accessibility-everywhere.org/api" target="_blank">accessibility-everywhere.org</a>
                            </p>
                        </td>
                    </tr>
                </table>

                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }

    /**
     * Dashboard widget content
     */
    public function dashboard_widget_content() {
        global $wpdb;

        $stats = [
            'total' => wp_count_posts()->publish,
            'scanned' => $wpdb->get_var("SELECT COUNT(*) FROM $wpdb->postmeta WHERE meta_key = '_a11y_score'"),
            'average' => round($wpdb->get_var("SELECT AVG(meta_value) FROM $wpdb->postmeta WHERE meta_key = '_a11y_score'")),
        ];

        ?>
        <div class="a11y-widget">
            <p>
                <strong><?php _e('Scanned Posts:', 'accessibility-everywhere'); ?></strong>
                <?php echo esc_html($stats['scanned']); ?> / <?php echo esc_html($stats['total']); ?>
            </p>
            <p>
                <strong><?php _e('Average Score:', 'accessibility-everywhere'); ?></strong>
                <span class="a11y-score-badge"><?php echo esc_html($stats['average']); ?></span>
            </p>
            <p>
                <a href="<?php echo admin_url('admin.php?page=accessibility-everywhere'); ?>" class="button">
                    <?php _e('View Details', 'accessibility-everywhere'); ?>
                </a>
            </p>
        </div>
        <?php
    }

    /**
     * Render recent scans
     */
    private function render_recent_scans() {
        global $wpdb;

        $recent = $wpdb->get_results("
            SELECT p.ID, p.post_title, pm.meta_value as score, pm2.meta_value as scan_date
            FROM $wpdb->posts p
            INNER JOIN $wpdb->postmeta pm ON p.ID = pm.post_id AND pm.meta_key = '_a11y_score'
            LEFT JOIN $wpdb->postmeta pm2 ON p.ID = pm2.post_id AND pm2.meta_key = '_a11y_last_scan'
            WHERE p.post_status = 'publish'
            ORDER BY pm2.meta_value DESC
            LIMIT 5
        ");

        if (empty($recent)) {
            echo '<p>' . __('No scans yet', 'accessibility-everywhere') . '</p>';
            return;
        }

        echo '<table class="widefat">';
        echo '<thead><tr><th>' . __('Post', 'accessibility-everywhere') . '</th><th>' . __('Score', 'accessibility-everywhere') . '</th><th>' . __('Date', 'accessibility-everywhere') . '</th></tr></thead>';
        echo '<tbody>';
        foreach ($recent as $scan) {
            echo '<tr>';
            echo '<td><a href="' . get_edit_post_link($scan->ID) . '">' . esc_html($scan->post_title) . '</a></td>';
            echo '<td><span class="a11y-score-badge">' . esc_html($scan->score) . '</span></td>';
            echo '<td>' . esc_html($scan->scan_date) . '</td>';
            echo '</tr>';
        }
        echo '</tbody></table>';
    }

    /**
     * Render common violations aggregated from all scanned posts.
     *
     * Displays a summary of the most frequent accessibility violations
     * found across the site's content.
     */
    private function render_common_violations() {
        global $wpdb;

        // Get all violation data from post meta
        $violations_data = $wpdb->get_col(
            "SELECT meta_value FROM $wpdb->postmeta WHERE meta_key = '_a11y_violations' AND meta_value != ''"
        );

        if (empty($violations_data)) {
            echo '<p>' . __('No violation data available yet. Scan some pages to see common issues.', 'accessibility-everywhere') . '</p>';
            echo '<p class="description">' . __('Tip: Enable auto-scan in settings or use the Quick Scan feature.', 'accessibility-everywhere') . '</p>';
            return;
        }

        // Aggregate violations by type
        $violation_counts = [];
        $violation_details = [];

        foreach ($violations_data as $json_data) {
            $violations = json_decode($json_data, true);
            if (!is_array($violations)) {
                continue;
            }

            foreach ($violations as $violation) {
                $id = $violation['id'] ?? 'unknown';

                if (!isset($violation_counts[$id])) {
                    $violation_counts[$id] = 0;
                    $violation_details[$id] = [
                        'description' => $violation['description'] ?? $id,
                        'impact' => $violation['impact'] ?? 'unknown',
                        'help' => $violation['help'] ?? '',
                        'helpUrl' => $violation['helpUrl'] ?? '',
                    ];
                }

                // Count nodes/instances
                $node_count = isset($violation['nodes']) ? count($violation['nodes']) : 1;
                $violation_counts[$id] += $node_count;
            }
        }

        if (empty($violation_counts)) {
            echo '<p class="a11y-success">' . __('No violations found across scanned pages.', 'accessibility-everywhere') . '</p>';
            return;
        }

        // Sort by count descending
        arsort($violation_counts);

        // Display top 10 violations
        $top_violations = array_slice($violation_counts, 0, 10, true);

        echo '<table class="widefat striped">';
        echo '<thead><tr>';
        echo '<th>' . esc_html__('Issue', 'accessibility-everywhere') . '</th>';
        echo '<th>' . esc_html__('Impact', 'accessibility-everywhere') . '</th>';
        echo '<th>' . esc_html__('Count', 'accessibility-everywhere') . '</th>';
        echo '</tr></thead>';
        echo '<tbody>';

        foreach ($top_violations as $violation_id => $count) {
            $details = $violation_details[$violation_id];
            $impact_class = 'a11y-impact-' . sanitize_html_class($details['impact']);

            echo '<tr>';
            echo '<td>';

            if (!empty($details['helpUrl'])) {
                echo '<a href="' . esc_url($details['helpUrl']) . '" target="_blank" rel="noopener noreferrer">';
                echo esc_html($details['description']);
                echo ' <span class="dashicons dashicons-external" aria-hidden="true"></span>';
                echo '<span class="screen-reader-text">' . esc_html__('(opens in new tab)', 'accessibility-everywhere') . '</span>';
                echo '</a>';
            } else {
                echo esc_html($details['description']);
            }

            if (!empty($details['help'])) {
                echo '<p class="description">' . esc_html($details['help']) . '</p>';
            }

            echo '</td>';
            echo '<td><span class="a11y-impact-badge ' . esc_attr($impact_class) . '">' . esc_html(ucfirst($details['impact'])) . '</span></td>';
            echo '<td><strong>' . esc_html(number_format_i18n($count)) . '</strong></td>';
            echo '</tr>';
        }

        echo '</tbody></table>';

        // Show total counts summary
        $total_violations = array_sum($violation_counts);
        $unique_issues = count($violation_counts);

        echo '<p class="a11y-summary">';
        printf(
            /* translators: 1: total violation count, 2: unique issue count */
            esc_html__('Total: %1$s violations across %2$s unique issue types.', 'accessibility-everywhere'),
            '<strong>' . esc_html(number_format_i18n($total_violations)) . '</strong>',
            '<strong>' . esc_html(number_format_i18n($unique_issues)) . '</strong>'
        );
        echo '</p>';
    }
}
