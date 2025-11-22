<?php
/**
 * Plugin Name: Accessibility Everywhere
 * Plugin URI: https://accessibility-everywhere.org/wordpress
 * Description: Real-time accessibility checking for WordPress. Scan content before publishing, track violations, and improve WCAG compliance.
 * Version: 1.0.0
 * Author: Accessibility Everywhere
 * Author URI: https://accessibility-everywhere.org
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: accessibility-everywhere
 * Domain Path: /languages
 */

// Prevent direct file access
if (!defined('ABSPATH')) {
    exit;
}

// Plugin constants
define('A11Y_VERSION', '1.0.0');
define('A11Y_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('A11Y_PLUGIN_URL', plugin_dir_url(__FILE__));
define('A11Y_API_BASE', 'https://api.accessibility-everywhere.org/v1');

// Load dependencies
require_once A11Y_PLUGIN_DIR . 'includes/class-a11y-scanner.php';
require_once A11Y_PLUGIN_DIR . 'includes/class-a11y-admin.php';
require_once A11Y_PLUGIN_DIR . 'includes/class-a11y-gutenberg.php';
require_once A11Y_PLUGIN_DIR . 'includes/class-a11y-settings.php';

/**
 * Main plugin class
 */
class Accessibility_Everywhere {
    /**
     * Singleton instance
     */
    private static $instance = null;

    /**
     * Scanner instance
     */
    public $scanner;

    /**
     * Admin instance
     */
    public $admin;

    /**
     * Get singleton instance
     */
    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        $this->scanner = new A11Y_Scanner();
        $this->admin = new A11Y_Admin();

        // Initialize
        add_action('plugins_loaded', [$this, 'load_textdomain']);
        add_action('init', [$this, 'init']);

        // Gutenberg integration
        if (function_exists('register_block_type')) {
            new A11Y_Gutenberg();
        }

        // Admin hooks
        if (is_admin()) {
            add_action('admin_menu', [$this->admin, 'add_menu']);
            add_action('admin_enqueue_scripts', [$this->admin, 'enqueue_scripts']);
        }

        // Save post hook (scan before publish)
        add_action('save_post', [$this, 'scan_on_publish'], 10, 3);

        // Dashboard widget
        add_action('wp_dashboard_setup', [$this, 'add_dashboard_widget']);

        // REST API endpoints
        add_action('rest_api_init', [$this, 'register_rest_routes']);
    }

    /**
     * Load text domain
     */
    public function load_textdomain() {
        load_plugin_textdomain(
            'accessibility-everywhere',
            false,
            dirname(plugin_basename(__FILE__)) . '/languages'
        );
    }

    /**
     * Initialize plugin
     */
    public function init() {
        // Add custom post meta for accessibility scores
        register_post_meta('post', '_a11y_score', [
            'type' => 'number',
            'single' => true,
            'show_in_rest' => true,
        ]);

        register_post_meta('post', '_a11y_last_scan', [
            'type' => 'string',
            'single' => true,
            'show_in_rest' => true,
        ]);

        register_post_meta('post', '_a11y_violations', [
            'type' => 'string',
            'single' => true,
            'show_in_rest' => true,
        ]);
    }

    /**
     * Scan post before publishing
     */
    public function scan_on_publish($post_id, $post, $update) {
        // Skip autosaves and revisions
        if (wp_is_post_autosave($post_id) || wp_is_post_revision($post_id)) {
            return;
        }

        // Only scan when publishing
        if ($post->post_status !== 'publish') {
            return;
        }

        // Check if auto-scan is enabled
        $settings = get_option('a11y_settings', []);
        if (empty($settings['auto_scan'])) {
            return;
        }

        // Scan the post
        $url = get_permalink($post_id);
        $result = $this->scanner->scan_url($url);

        if (!is_wp_error($result)) {
            // Store results
            update_post_meta($post_id, '_a11y_score', $result['score']);
            update_post_meta($post_id, '_a11y_last_scan', current_time('mysql'));
            update_post_meta($post_id, '_a11y_violations', json_encode($result['violations']));

            // Check minimum score requirement
            $min_score = intval($settings['min_score'] ?? 0);
            if ($min_score > 0 && $result['score'] < $min_score) {
                // Add admin notice
                set_transient('a11y_low_score_' . $post_id, $result['score'], 60);
            }
        }
    }

    /**
     * Add dashboard widget
     */
    public function add_dashboard_widget() {
        wp_add_dashboard_widget(
            'a11y_dashboard_widget',
            __('Accessibility Overview', 'accessibility-everywhere'),
            [$this->admin, 'dashboard_widget_content']
        );
    }

    /**
     * Register REST API routes
     */
    public function register_rest_routes() {
        register_rest_route('accessibility-everywhere/v1', '/scan', [
            'methods' => 'POST',
            'callback' => [$this, 'rest_scan'],
            'permission_callback' => function() {
                return current_user_can('edit_posts');
            },
        ]);

        register_rest_route('accessibility-everywhere/v1', '/stats', [
            'methods' => 'GET',
            'callback' => [$this, 'rest_stats'],
            'permission_callback' => function() {
                return current_user_can('read');
            },
        ]);
    }

    /**
     * REST API: Scan endpoint
     */
    public function rest_scan($request) {
        $url = $request->get_param('url');
        if (empty($url)) {
            return new WP_Error('missing_url', __('URL is required', 'accessibility-everywhere'), ['status' => 400]);
        }

        $result = $this->scanner->scan_url($url);

        if (is_wp_error($result)) {
            return $result;
        }

        return new WP_REST_Response($result, 200);
    }

    /**
     * REST API: Stats endpoint
     */
    public function rest_stats($request) {
        global $wpdb;

        $stats = [
            'total_posts' => wp_count_posts()->publish,
            'scanned_posts' => $wpdb->get_var(
                "SELECT COUNT(*) FROM $wpdb->postmeta WHERE meta_key = '_a11y_score'"
            ),
            'average_score' => $wpdb->get_var(
                "SELECT AVG(meta_value) FROM $wpdb->postmeta WHERE meta_key = '_a11y_score'"
            ),
        ];

        return new WP_REST_Response($stats, 200);
    }
}

// Initialize plugin
function accessibility_everywhere() {
    return Accessibility_Everywhere::get_instance();
}

accessibility_everywhere();

// Activation hook
register_activation_hook(__FILE__, function() {
    // Set default options
    $defaults = [
        'auto_scan' => true,
        'wcag_level' => 'AA',
        'min_score' => 70,
        'api_key' => '',
    ];

    add_option('a11y_settings', $defaults);
});

// Deactivation hook
register_deactivation_hook(__FILE__, function() {
    // Clean up transients
    global $wpdb;
    $wpdb->query("DELETE FROM $wpdb->options WHERE option_name LIKE '_transient_a11y_%'");
});
