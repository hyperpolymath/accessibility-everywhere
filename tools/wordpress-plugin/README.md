# Accessibility Everywhere WordPress Plugin

Real-time accessibility checking for WordPress. Scan content before publishing, track violations, and improve WCAG compliance.

## Features

✅ **Auto-Scan on Publish** - Automatically check accessibility when publishing posts
✅ **Gutenberg Integration** - Real-time checking in the block editor
✅ **Dashboard Widget** - Site-wide accessibility overview
✅ **Post Meta** - Store scores and violations with each post
✅ **Minimum Score Requirements** - Block publishing if score too low (optional)
✅ **API Integration** - Connect to Accessibility Everywhere API for detailed scans
✅ **REST API** - Programmatic access to scanning functionality

## Installation

### From WordPress.org (Coming Soon)
1. Go to Plugins → Add New
2. Search for "Accessibility Everywhere"
3. Install and activate

### Manual Installation
1. Download the plugin zip
2. Go to Plugins → Add New → Upload Plugin
3. Upload the zip file
4. Activate the plugin

### From GitHub
```bash
cd wp-content/plugins
git clone https://github.com/accessibility-everywhere/wordpress-plugin accessibility-everywhere
```

## Configuration

Go to **Accessibility → Settings** to configure:

- **Auto-Scan on Publish**: Automatically scan posts when publishing
- **WCAG Level**: Choose compliance level (A, AA, or AAA)
- **Minimum Score**: Set required score (warn/block if below)
- **API Key**: Optional - for server-side scanning via API

## Usage

### Automatic Scanning

When auto-scan is enabled, posts are automatically scanned when published. The score is saved as post meta and displayed in the admin.

### Manual Scanning

Go to **Accessibility → Overview** to:
- Scan entire site
- View recent scans
- See common violations
- Quick scan any URL

### Gutenberg Integration

In the block editor, accessibility issues are highlighted in real-time (when API key configured).

### Displaying Scores

Access post accessibility data:

```php
$post_id = get_the_ID();
$score = get_post_meta($post_id, '_a11y_score', true);
$last_scan = get_post_meta($post_id, '_a11y_last_scan', true);
$violations = json_decode(get_post_meta($post_id, '_a11y_violations', true), true);

echo "Accessibility Score: $score/100";
```

### REST API

**Scan a URL:**
```http
POST /wp-json/accessibility-everywhere/v1/scan
Content-Type: application/json

{
  "url": "https://example.com/post"
}
```

**Get Stats:**
```http
GET /wp-json/accessibility-everywhere/v1/stats
```

## API Key

Get a free API key from [accessibility-everywhere.org](https://accessibility-everywhere.org/api)

Benefits of API key:
- Server-side scanning (more reliable)
- Detailed violation reports
- Historical data
- Advanced analytics

Free tier: 1,000 scans/month

## Requirements

- WordPress 5.0+
- PHP 7.4+
- Modern browser (for Gutenberg)

## Hooks & Filters

**Actions:**
```php
// Before scanning a post
do_action('a11y_before_scan', $post_id, $url);

// After scanning a post
do_action('a11y_after_scan', $post_id, $result);

// When low score detected
do_action('a11y_low_score', $post_id, $score);
```

**Filters:**
```php
// Modify scan options
$options = apply_filters('a11y_scan_options', $options, $post_id);

// Modify minimum score requirement
$min_score = apply_filters('a11y_min_score', $min_score, $post_id);

// Modify score calculation
$score = apply_filters('a11y_calculate_score', $score, $result);
```

## Privacy

This plugin:
- Stores accessibility scores locally in post meta
- Optionally sends URLs to Accessibility Everywhere API (if API key configured)
- Does not collect personal information
- Does not track users

[Privacy Policy](https://accessibility-everywhere.org/privacy)

## Support

- Documentation: [accessibility-everywhere.org/docs/wordpress](https://accessibility-everywhere.org/docs/wordpress)
- Support Forum: [WordPress.org](https://wordpress.org/support/plugin/accessibility-everywhere)
- GitHub Issues: [github.com/accessibility-everywhere/wordpress-plugin](https://github.com/accessibility-everywhere/wordpress-plugin)

## Contributing

Contributions welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md)

## License

GPL v2 or later
