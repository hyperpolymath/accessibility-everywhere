<?php
/**
 * Gutenberg integration class
 */
class A11Y_Gutenberg {
    public function __construct() {
        add_action('enqueue_block_editor_assets', [$this, 'enqueue_block_editor_assets']);
    }

    /**
     * Enqueue block editor assets
     */
    public function enqueue_block_editor_assets() {
        wp_enqueue_script(
            'a11y-gutenberg',
            A11Y_PLUGIN_URL . 'assets/js/gutenberg.js',
            ['wp-blocks', 'wp-element', 'wp-editor', 'wp-plugins', 'wp-edit-post'],
            A11Y_VERSION
        );

        wp_localize_script('a11y-gutenberg', 'a11yGutenberg', [
            'apiUrl' => rest_url('accessibility-everywhere/v1'),
            'nonce' => wp_create_nonce('wp_rest'),
        ]);

        wp_enqueue_style(
            'a11y-gutenberg',
            A11Y_PLUGIN_URL . 'assets/css/gutenberg.css',
            [],
            A11Y_VERSION
        );
    }
}
