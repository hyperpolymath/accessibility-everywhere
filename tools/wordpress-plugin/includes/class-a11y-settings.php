<?php
/**
 * Settings class for managing Accessibility Everywhere plugin configuration.
 *
 * Provides methods to get, set, and manage plugin settings including:
 * - Auto-scan on publish
 * - WCAG compliance level
 * - Minimum score thresholds
 * - API key management
 * - Badge display preferences
 *
 * @since 1.0.0
 */
class A11Y_Settings {
    public static function get_defaults() {
        return [
            'auto_scan' => true,
            'wcag_level' => 'AA',
            'min_score' => 70,
            'api_key' => '',
            'show_badges' => true,
            'block_publish_on_failure' => false,
        ];
    }

    public static function get($key, $default = null) {
        $settings = get_option('a11y_settings', self::get_defaults());
        return $settings[$key] ?? $default;
    }

    public static function set($key, $value) {
        $settings = get_option('a11y_settings', self::get_defaults());
        $settings[$key] = $value;
        update_option('a11y_settings', $settings);
    }
}
