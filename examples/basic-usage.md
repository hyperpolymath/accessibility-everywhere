<!--
SPDX-License-Identifier: MPL-2.0
Copyright (c) Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
-->
# Basic Usage Examples

## Browser Extension

### Installation
1. Install from [Chrome Web Store](https://chrome.google.com/webstore) or [Firefox Add-ons](https://addons.mozilla.org)
2. Click the extension icon in your toolbar
3. Navigate to any website
4. Click "Scan Now" to see the accessibility score

### Features
- Real-time scoring
- Violation details
- WCAG level selection (A/AA/AAA)
- Export reports
- Historical tracking

## Testing Dashboard

### Quick Scan
1. Visit [accessibility-everywhere.org](https://accessibility-everywhere.org)
2. Enter a URL
3. Select WCAG level
4. Click "Scan Now"
5. Review detailed results

### Sharing Results
- Click "Share Report" button
- Copy shareable URL
- Post on social media or send to team

## CLI Tool

### Installation
```bash
npm install -g @accessibility-everywhere/cli
```

### Basic Scan
```bash
a11y-scan https://example.com
```

### Custom WCAG Level
```bash
a11y-scan https://example.com --level AAA
```

### Export Results
```bash
a11y-scan https://example.com --output report.json
```

### CI/CD Mode
```bash
a11y-scan ci https://staging.example.com --min-score 80 --fail-on-violations
```

### Batch Scanning
```bash
# Create urls.txt with one URL per line
echo "https://example.com" > urls.txt
echo "https://example.com/about" >> urls.txt
echo "https://example.com/contact" >> urls.txt

# Scan all
a11y-scan batch urls.txt --output ./results
```

## npm Package

### Installation
```bash
npm install @accessibility-everywhere/scanner
```

### Basic Usage
```javascript
const { createScanner } = require('@accessibility-everywhere/scanner');

async function scanSite() {
  const scanner = createScanner();

  const result = await scanner.scan({
    url: 'https://example.com',
    wcagLevel: 'AA'
  });

  console.log(`Score: ${result.score}/100`);
  console.log(`Violations: ${result.violations.length}`);

  // Process violations
  result.violations.forEach(violation => {
    console.log(`- ${violation.description}`);
    console.log(`  Impact: ${violation.impact}`);
    console.log(`  Help: ${violation.helpUrl}`);
  });
}

scanSite();
```

### TypeScript
```typescript
import { createScanner, ScanResult } from '@accessibility-everywhere/scanner';

async function scanWithTypes(): Promise<ScanResult> {
  const scanner = createScanner();

  return await scanner.scan({
    url: 'https://example.com',
    wcagLevel: 'AA',
    screenshot: true
  });
}
```

## GitHub Action

### Basic Workflow
```yaml
name: Accessibility Check
on: [pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Staging
        run: |
          # Your deployment commands
          echo "STAGING_URL=https://staging.example.com" >> $GITHUB_ENV

      - name: Accessibility Scan
        uses: accessibility-everywhere/scan-action@v1
        with:
          url: ${{ env.STAGING_URL }}
          wcag-level: AA
          fail-on-violations: true
          comment-pr: true
```

### Advanced Configuration
```yaml
- name: Accessibility Scan
  uses: accessibility-everywhere/scan-action@v1
  with:
    url: ${{ env.STAGING_URL }}
    wcag-level: AAA
    min-score: 90
    fail-on-violations: true
    comment-pr: true
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

## WordPress Plugin

### Installation
1. Download plugin from WordPress.org
2. Upload to wp-content/plugins/
3. Activate in WordPress admin

### Configuration
1. Go to **Accessibility → Settings**
2. Enable auto-scan on publish
3. Set WCAG level (AA recommended)
4. Set minimum score threshold
5. Optional: Add API key for advanced features

### Usage
- Posts are automatically scanned when published
- View scores in post list
- See details in **Accessibility → Overview**
- Dashboard widget shows site-wide stats

## React Components

### Installation
```bash
npm install @accessibility-everywhere/react
```

### Button Component
```jsx
import { Button } from '@accessibility-everywhere/react';

function MyComponent() {
  return (
    <Button
      variant="primary"
      size="md"
      onClick={() => console.log('Clicked!')}
      loading={isLoading}
    >
      Click Me
    </Button>
  );
}
```

### Modal Component
```jsx
import { Modal, Button } from '@accessibility-everywhere/react';
import { useState } from 'react';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Open Modal
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Action"
      >
        <p>Are you sure you want to proceed?</p>
        <Button onClick={() => setIsOpen(false)}>
          Confirm
        </Button>
      </Modal>
    </>
  );
}
```

## API Integration

### Scan Endpoint
```javascript
const response = await fetch('https://api.accessibility-everywhere.org/v1/scan', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    url: 'https://example.com',
    wcagLevel: 'AA'
  })
});

const data = await response.json();
console.log(data.score);
```

### Leaderboard Data
```javascript
const response = await fetch('https://api.accessibility-everywhere.org/v1/leaderboard?limit=100');
const data = await response.json();

data.sites.forEach(site => {
  console.log(`${site.rank}. ${site.domain}: ${site.score}/100`);
});
```

### Badge Display
```html
<img src="https://api.accessibility-everywhere.org/v1/badge/example.com?format=svg"
     alt="Accessibility Score: A (94/100)">
```

## Next Steps

- Read the [full documentation](https://accessibility-everywhere.org/docs)
- Join the [community](https://discord.gg/accessibility-everywhere)
- Check the [API reference](https://accessibility-everywhere.org/api)
- See [advanced examples](./advanced-usage.md)
