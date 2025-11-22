# Accessibility Everywhere Browser Extension

Real-time accessibility scanning and scoring for web pages using axe-core.

## Features

- **Instant Accessibility Scores**: See WCAG compliance scores for any webpage
- **Detailed Violation Reports**: View specific accessibility issues with guidance
- **WCAG Level Support**: Test against Level A, AA, or AAA standards
- **Export Reports**: Download accessibility reports as JSON
- **Badge Indicators**: See scores directly in your browser toolbar
- **Context Menu Integration**: Quick access to scan any page

## Installation

### Chrome Web Store
1. Visit the [Chrome Web Store](https://chrome.google.com/webstore)
2. Search for "Accessibility Everywhere"
3. Click "Add to Chrome"

### Firefox Add-ons
1. Visit [Firefox Add-ons](https://addons.mozilla.org)
2. Search for "Accessibility Everywhere"
3. Click "Add to Firefox"

### Manual Installation (Development)

#### Chrome
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `tools/browser-extension` directory

#### Firefox
1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file from `tools/browser-extension`

## Usage

1. **Click the extension icon** in your browser toolbar
2. **Wait for the scan** to complete (usually 2-5 seconds)
3. **Review the results**:
   - Overall accessibility score
   - Number of violations, passes, and items needing review
   - Detailed list of issues with impact levels
4. **Take action**:
   - View full report for detailed analysis
   - Export report for sharing with your team
   - Rescan after making fixes

## WCAG Levels

- **Level A**: Minimum accessibility requirements
- **Level AA**: Recommended standard for most websites (default)
- **Level AAA**: Highest accessibility standard

## Building from Source

```bash
# Install dependencies
npm install

# Copy axe-core
npm run copy-axe

# Package for Chrome
npm run package:chrome

# Package for Firefox
npm run package:firefox
```

## Privacy

This extension:
- Runs scans locally in your browser
- Does not send your browsing data to any server
- Only accesses pages when you explicitly trigger a scan
- Stores preferences locally

## Contributing

Contributions are welcome! Please see the main repository [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../../LICENSE) for details

## Support

- Report issues: [GitHub Issues](https://github.com/accessibility-everywhere/issues)
- Documentation: [accessibility-everywhere.org/docs](https://accessibility-everywhere.org/docs)
- WCAG Guidelines: [W3C WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
