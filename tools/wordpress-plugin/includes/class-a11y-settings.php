<?php
/**
 * Settings class (placeholder for additional settings functionality)
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
