<!--
SPDX-License-Identifier: CC-BY-SA-4.0
Copyright (c) Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
-->
# Security Policy

## Supported Versions

We release security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**DO NOT** create public GitHub issues for security vulnerabilities.

### How to Report

Send vulnerability reports to: **security@accessibility-everywhere.org**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)
- Your contact information

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 5 business days
- **Status updates**: At least every 7 days
- **Fix timeline**: Depends on severity (see below)

### Severity Levels

**Critical** (CVSS 9.0-10.0)
- Public disclosure of user data
- Remote code execution
- Authentication bypass
- **Fix timeline**: 7 days

**High** (CVSS 7.0-8.9)
- Privilege escalation
- SQL injection
- XSS with data theft potential
- **Fix timeline**: 30 days

**Medium** (CVSS 4.0-6.9)
- CSRF
- Information disclosure (limited)
- **Fix timeline**: 90 days

**Low** (CVSS 0.1-3.9)
- Best practice violations
- Theoretical vulnerabilities
- **Fix timeline**: Next release

### Disclosure Policy

- We follow **coordinated disclosure**
- Security advisories published after fix is released
- You will be credited (unless you prefer anonymity)
- CVE IDs requested for qualifying vulnerabilities

## Security Measures

### Infrastructure

- **ArangoDB**: Latest stable version, authentication required
- **API**: Rate limiting, input validation (Joi), CORS, Helmet.js
- **Secrets**: Environment variables, never committed
- **Dependencies**: Automated security scanning (Dependabot)

### Code Practices

- **Input validation**: All user inputs sanitized
- **SQL injection**: Parameterized queries only
- **XSS prevention**: Content Security Policy, output encoding
- **CSRF protection**: Token-based validation
- **Authentication**: Secure session management
- **Authorization**: Principle of least privilege

### Browser Extension

- **Manifest V3**: Latest security standards
- **Permissions**: Minimal required permissions
- **CSP**: Strict Content Security Policy
- **No eval()**: No dynamic code execution
- **HTTPS only**: All API calls over HTTPS

### API Security

- **Rate limiting**: 100 requests per 15 minutes per IP
- **API keys**: Required for authenticated endpoints
- **HTTPS**: TLS 1.3 required
- **CORS**: Whitelist-based origins
- **Headers**: Security headers (HSTS, X-Frame-Options, etc.)

### Data Protection

- **Encryption at rest**: Database encryption enabled
- **Encryption in transit**: HTTPS/TLS 1.3
- **PII handling**: Minimal collection, anonymization where possible
- **Data retention**: Configurable, 90 days default
- **Right to deletion**: GDPR-compliant data removal

## Known Security Considerations

### Client-Side Scanning

The browser extension performs accessibility scanning in the client's browser:
- **Isolation**: Scans run in sandboxed context
- **No data exfiltration**: Results stay local unless user explicitly exports
- **Privacy**: No tracking, no analytics by default

### API Scanning

When using the API for scanning:
- **URL validation**: Prevent SSRF attacks
- **Resource limits**: Timeout after 30 seconds, max page size 10MB
- **Sandboxing**: Puppeteer runs in containerized environment
- **No credential harvesting**: Scanner does not follow authenticated pages

### WordPress Plugin

- **Nonce verification**: All AJAX requests protected
- **Capability checks**: Proper WordPress permission checks
- **SQL injection**: Uses WordPress prepared statements
- **XSS prevention**: Output escaping with WordPress functions

## Security Audits

- **Last audit**: Not yet conducted (project launch: 2024)
- **Next planned audit**: Q2 2025
- **Automated scanning**: GitHub Dependabot, npm audit
- **Manual review**: All PRs reviewed for security implications

## Compliance

### Standards

- **OWASP Top 10**: All critical vulnerabilities addressed
- **CWE/SANS Top 25**: Most dangerous software errors mitigated
- **GDPR**: Privacy by design, data minimization
- **WCAG 2.1 AA**: Accessibility security (screen reader compatibility)

### Certifications

- **SOC 2** (planned for 2025 if API revenue justifies)
- **ISO 27001** (future consideration for enterprise tier)

## Bug Bounty Program

**Status**: Not yet launched

**Planned**: Q3 2025 after sufficient adoption

**Scope**: Browser extension, API, dashboard
**Out of scope**: Third-party dependencies, local development environments

## Security Champions

**Security Team**: security@accessibility-everywhere.org

**Response Team**:
- Infrastructure: DevOps lead
- Application: Lead developers
- Compliance: Legal/privacy officer

## External Resources

- **OWASP**: https://owasp.org
- **CWE**: https://cwe.mitre.org
- **NIST NVD**: https://nvd.nist.gov
- **Security.txt**: `/.well-known/security.txt` (RFC 9116)

## Acknowledgments

We thank the security research community for responsible disclosure:

(No reports yet - project launch 2024)

---

**Last updated**: 2024-01-22
**Version**: 1.0
**Contact**: security@accessibility-everywhere.org
**PGP Key**: (To be added)
