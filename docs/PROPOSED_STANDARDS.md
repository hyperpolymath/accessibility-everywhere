# Proposed Accessibility Standards
## Making Accessibility Machine-Readable and Verifiable

### Overview

This document proposes three complementary standards to make website accessibility commitments machine-readable, verifiable, and discoverable. These standards are modeled after successful security standards (CSP, security.txt) and designed for easy adoption.

---

## 1. Accessibility-Policy HTTP Header

### Specification

**Header Name**: `Accessibility-Policy`

**Syntax**:
```
Accessibility-Policy: <directive>; <directive>; ...
```

### Directives

#### Core Directives

**wcag-level** (required)
- Values: `A`, `AA`, `AAA`
- Specifies the WCAG compliance level the site commits to

```
Accessibility-Policy: wcag-level=AA
```

**report-uri** (recommended)
- Value: Absolute or relative URI
- Endpoint for reporting accessibility violations

```
Accessibility-Policy: wcag-level=AA; report-uri=/api/a11y-reports
```

**public-score** (optional)
- Values: `true`, `false`
- Indicates if accessibility score should be publicly visible
- Default: `false`

```
Accessibility-Policy: wcag-level=AA; public-score=true
```

**last-audit** (recommended)
- Value: ISO 8601 date
- Date of last professional accessibility audit

```
Accessibility-Policy: wcag-level=AA; last-audit=2024-01-15
```

**statement** (recommended)
- Value: Absolute or relative URI
- Link to accessibility statement page

```
Accessibility-Policy: wcag-level=AA; statement=/accessibility
```

**contact** (recommended)
- Value: Email address or URI
- Contact for accessibility issues

```
Accessibility-Policy: wcag-level=AA; contact=a11y@example.com
```

**badge** (optional)
- Values: `verified`, `self-reported`
- Indicates verification status
- `verified`: Third-party verification completed
- `self-reported`: Self-assessment only

```
Accessibility-Policy: wcag-level=AA; badge=verified
```

#### Advanced Directives

**exceptions**
- Value: Comma-separated list of WCAG criteria
- Lists known exceptions/violations being addressed

```
Accessibility-Policy: wcag-level=AA; exceptions=1.4.3,2.4.7
```

**remediation-plan**
- Value: URI
- Link to public remediation roadmap

```
Accessibility-Policy: wcag-level=AA; remediation-plan=/a11y-roadmap
```

**tools**
- Value: Comma-separated list of testing tools used
- Transparency about testing methodology

```
Accessibility-Policy: wcag-level=AA; tools=axe,wave,lighthouse
```

**compliance-date**
- Value: ISO 8601 date
- Target date for full compliance

```
Accessibility-Policy: wcag-level=AA; compliance-date=2024-12-31
```

### Complete Example

```http
HTTP/1.1 200 OK
Content-Type: text/html
Accessibility-Policy: wcag-level=AA;
                      report-uri=/api/a11y-reports;
                      public-score=true;
                      last-audit=2024-01-15;
                      statement=/accessibility;
                      contact=accessibility@example.com;
                      badge=verified;
                      tools=axe,lighthouse
```

### Implementation

#### Express.js (Node.js)
```javascript
app.use((req, res, next) => {
  res.setHeader(
    'Accessibility-Policy',
    'wcag-level=AA; report-uri=/api/a11y-reports; public-score=true'
  );
  next();
});
```

#### Nginx
```nginx
add_header Accessibility-Policy "wcag-level=AA; public-score=true" always;
```

#### Apache
```apache
Header set Accessibility-Policy "wcag-level=AA; public-score=true"
```

#### Next.js
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Accessibility-Policy',
            value: 'wcag-level=AA; public-score=true'
          }
        ]
      }
    ];
  }
};
```

---

## 2. /.well-known/accessibility Endpoint

### Specification

**Path**: `/.well-known/accessibility`

**Content-Type**: `application/json`

**Purpose**: Provide machine-readable accessibility information similar to `security.txt`

### Schema

```json
{
  "$schema": "https://accessibility-everywhere.org/schema/v1/accessibility.json",
  "version": "1.0",
  "wcag": {
    "level": "AA",
    "version": "2.1",
    "target_date": "2024-06-01",
    "exceptions": ["1.4.3"]
  },
  "audit": {
    "last_date": "2024-01-15",
    "auditor": "Independent Accessibility Auditors Inc.",
    "report_url": "https://example.com/audit-report-2024.pdf",
    "next_date": "2024-07-15"
  },
  "score": {
    "value": 94,
    "last_updated": "2024-01-20",
    "public": true,
    "tool": "accessibility-everywhere",
    "breakdown": {
      "violations": 3,
      "passes": 147,
      "incomplete": 5
    }
  },
  "contact": {
    "email": "accessibility@example.com",
    "url": "https://example.com/accessibility-feedback",
    "phone": "+1-555-0123"
  },
  "statement": {
    "url": "https://example.com/accessibility-statement",
    "last_updated": "2024-01-10"
  },
  "remediation": {
    "plan_url": "https://example.com/accessibility-roadmap",
    "target_completion": "2024-12-31",
    "priorities": [
      {
        "criterion": "1.4.3",
        "title": "Contrast (Minimum)",
        "target_date": "2024-03-01",
        "status": "in_progress"
      }
    ]
  },
  "technologies": {
    "primary": ["HTML5", "CSS3", "JavaScript"],
    "frameworks": ["React", "Next.js"],
    "testing_tools": ["axe-core", "Lighthouse", "WAVE"],
    "assistive_tech_tested": ["NVDA", "JAWS", "VoiceOver"]
  },
  "features": {
    "keyboard_navigation": true,
    "skip_links": true,
    "aria_landmarks": true,
    "alt_text": true,
    "captions": true,
    "transcripts": false,
    "high_contrast": true,
    "font_scaling": true,
    "dyslexia_friendly": false
  },
  "certifications": [
    {
      "type": "WCAG 2.1 AA",
      "issuer": "Independent Auditor",
      "date": "2024-01-15",
      "expiry": "2025-01-15",
      "certificate_url": "https://example.com/wcag-cert.pdf"
    }
  ],
  "legal": {
    "jurisdiction": "US",
    "regulations": ["ADA", "Section 508"],
    "vpat_url": "https://example.com/vpat.pdf"
  }
}
```

### Required Fields

Minimum valid endpoint:

```json
{
  "version": "1.0",
  "wcag": {
    "level": "AA",
    "version": "2.1"
  },
  "contact": {
    "email": "accessibility@example.com"
  }
}
```

### Implementation

**Static file** (simplest):
```bash
# Create file at public/.well-known/accessibility
{
  "version": "1.0",
  "wcag": { "level": "AA", "version": "2.1" },
  "contact": { "email": "a11y@example.com" }
}
```

**Express.js** (dynamic):
```javascript
app.get('/.well-known/accessibility', async (req, res) => {
  const data = await getAccessibilityData();
  res.json(data);
});
```

**Nginx** (static):
```nginx
location /.well-known/accessibility {
    default_type application/json;
    alias /var/www/html/.well-known/accessibility;
}
```

### Discovery

Browsers and tools can automatically discover this endpoint:

```javascript
const response = await fetch('https://example.com/.well-known/accessibility');
const accessibilityInfo = await response.json();

console.log(`WCAG Level: ${accessibilityInfo.wcag.level}`);
console.log(`Score: ${accessibilityInfo.score.value}`);
```

---

## 3. DNS TXT Record

### Specification

**Record Name**: `_accessibility.<domain>`

**Record Type**: `TXT`

**Purpose**: Provide quick, cacheable accessibility information via DNS

### Syntax

```
v=ACCESSIBILITY1; <tag>=<value>; <tag>=<value>; ...
```

### Tags

**v** (required)
- Version number
- Current: `ACCESSIBILITY1`

**wcag** (required)
- WCAG level: `A`, `AA`, or `AAA`

**score** (optional)
- Numeric score: 0-100

**verified** (optional)
- ISO 8601 date of last verification

**contact** (optional)
- Email address for accessibility issues

**endpoint** (optional)
- URL to /.well-known/accessibility endpoint

### Examples

**Basic**:
```
_accessibility.example.com TXT "v=ACCESSIBILITY1; wcag=AA"
```

**Complete**:
```
_accessibility.example.com TXT "v=ACCESSIBILITY1; wcag=AA; score=94; verified=2024-01-15; contact=a11y@example.com; endpoint=https://example.com/.well-known/accessibility"
```

### Lookup

```bash
# Command line
dig TXT _accessibility.example.com +short

# Output:
# "v=ACCESSIBILITY1; wcag=AA; score=94; verified=2024-01-15"
```

```javascript
// Node.js
const dns = require('dns').promises;

const records = await dns.resolveTxt('_accessibility.example.com');
console.log(records[0].join(''));
// Output: v=ACCESSIBILITY1; wcag=AA; score=94
```

### Implementation

**Cloudflare**:
```
Type: TXT
Name: _accessibility
Content: v=ACCESSIBILITY1; wcag=AA; score=94; verified=2024-01-15
TTL: 3600
```

**Route 53** (AWS):
```json
{
  "Name": "_accessibility.example.com.",
  "Type": "TXT",
  "TTL": 3600,
  "ResourceRecords": [
    {
      "Value": "\"v=ACCESSIBILITY1; wcag=AA; score=94; verified=2024-01-15\""
    }
  ]
}
```

### Benefits

1. **Fast**: DNS is cached and very fast
2. **Simple**: One-line record
3. **Verifiable**: Cannot be spoofed without DNS access
4. **Discoverable**: Automated tools can check thousands of domains quickly

---

## 4. Badge Verification System

### Purpose

Allow sites to display verified accessibility badges with cryptographic proof.

### Badge URL Format

```
https://api.accessibility-everywhere.org/v1/badge/<domain>?format=svg
```

### Badge Appearance

Based on score:

- **A (90-100)**: Green badge
- **B (80-89)**: Light green
- **C (70-79)**: Yellow
- **D (60-69)**: Orange
- **F (0-59)**: Red

### Verification

Badges include cryptographic signature:

```html
<img src="https://api.accessibility-everywhere.org/v1/badge/example.com?format=svg"
     alt="Accessibility Score: A (94/100)"
     data-verified="sha256:abc123...">
```

### Verification API

```
GET /v1/badge/<domain>/verify
```

Response:
```json
{
  "domain": "example.com",
  "verified": true,
  "score": 94,
  "grade": "A",
  "last_scan": "2024-01-20T10:30:00Z",
  "signature": "sha256:abc123...",
  "cert_url": "https://api.accessibility-everywhere.org/v1/cert/example.com"
}
```

### Implementation

```html
<!-- Embed badge -->
<a href="https://accessibility-everywhere.org/report?url=example.com">
  <img src="https://api.accessibility-everywhere.org/v1/badge/example.com?format=svg"
       alt="Accessibility Score: A (94/100)"
       width="160" height="28">
</a>
```

---

## 5. Accessibility Certificate

### Digital Certificate

Similar to SSL certificates, provide verifiable accessibility certificates.

### Format

**File**: `/accessibility-cert.json`

```json
{
  "version": "1.0",
  "domain": "example.com",
  "issued": "2024-01-15T00:00:00Z",
  "expires": "2025-01-15T00:00:00Z",
  "issuer": "Accessibility Everywhere",
  "wcag_level": "AA",
  "score": 94,
  "grade": "A",
  "signature": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
  "verification_url": "https://api.accessibility-everywhere.org/v1/verify/abc123"
}
```

### Renewal

- Automatic monthly scans
- Certificate auto-renews if score maintained
- Email alerts if score drops below threshold

---

## 6. Integration Guide

### Full Implementation Checklist

For maximum benefit, implement all standards:

- [ ] Add `Accessibility-Policy` HTTP header
- [ ] Create `/.well-known/accessibility` endpoint
- [ ] Set up `_accessibility` DNS TXT record
- [ ] Display verified badge on homepage
- [ ] Create public accessibility statement
- [ ] Set up violation reporting endpoint
- [ ] Implement regular scanning
- [ ] Monitor score and trends

### Phased Approach

**Phase 1** (5 minutes):
- Add `Accessibility-Policy` header
- Create minimal `/.well-known/accessibility`

**Phase 2** (30 minutes):
- Add DNS TXT record
- Embed verification badge
- Create accessibility statement page

**Phase 3** (Ongoing):
- Set up automated scanning
- Implement violation reporting
- Monitor and improve score

---

## 7. Tooling Support

### Browser Extension

Automatically detects and displays:
- `Accessibility-Policy` header
- `/.well-known/accessibility` endpoint
- DNS TXT record
- Badge verification status

### CLI Tool

```bash
# Check all standards
a11y-scan check-standards https://example.com

# Output:
# ✓ Accessibility-Policy header found (wcag-level=AA)
# ✓ /.well-known/accessibility endpoint found
# ✓ DNS TXT record found (_accessibility.example.com)
# ✓ Badge verified
# ✓ All standards implemented correctly!
```

### API

```
GET /v1/standards/check?url=example.com
```

Response:
```json
{
  "domain": "example.com",
  "standards": {
    "http_header": {
      "found": true,
      "wcag_level": "AA",
      "directives": ["wcag-level=AA", "public-score=true"]
    },
    "well_known": {
      "found": true,
      "valid": true,
      "score": 94
    },
    "dns_txt": {
      "found": true,
      "verified": true
    },
    "badge": {
      "found": true,
      "verified": true
    }
  },
  "compliance_score": 100
}
```

---

## Conclusion

These standards provide a comprehensive, verifiable framework for declaring and proving accessibility commitments. By making accessibility machine-readable, we enable:

1. **Automated verification** by search engines and tools
2. **Public accountability** through transparent scoring
3. **Easy adoption** with simple implementation
4. **Standardization** across the industry

Modeled after successful security standards, these proposals leverage existing infrastructure (HTTP headers, DNS, well-known URIs) to make accessibility a first-class web standard.

---

*Specification Version: 1.0*
*Last Updated: 2024-01-22*
*Status: Proposed*
*Feedback: standards@accessibility-everywhere.org*
