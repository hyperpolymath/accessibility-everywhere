<!--
SPDX-License-Identifier: MPL-2.0
Copyright (c) Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
-->
# Tri-Perimeter Contribution Framework (TPCF)

## Overview

Accessibility Everywhere uses the Tri-Perimeter Contribution Framework (TPCF) to manage contributions and access control based on graduated trust levels.

## Three Perimeters

### Perimeter 1: Maintainer Circle (Private)
**Access Level**: Full control
**Trust Level**: Maximum
**Members**: Project maintainers only

**Permissions**:
- Write access to main branch
- Merge pull requests
- Create releases
- Manage repository settings
- Access to production credentials
- Security vulnerability coordination

**Responsibilities**:
- Code review (within 48 hours)
- Security incident response
- Release management
- Community moderation
- Strategic decisions

**How to Join**:
- Invitation only
- Unanimous vote by existing maintainers
- Demonstrated long-term commitment (6+ months)
- See [MAINTAINERS.md](MAINTAINERS.md)

**Current Members**: See [MAINTAINERS.md](MAINTAINERS.md)

---

### Perimeter 2: Contributor Sphere (Semi-Open)
**Access Level**: Read + Propose
**Trust Level**: Established
**Members**: Active contributors

**Permissions**:
- Fork and create pull requests
- Participate in discussions
- Report issues
- Review pull requests
- Access to contributor Discord channel
- Early access to features

**Requirements**:
- 3+ merged pull requests
- Follow Code of Conduct
- Pass accessibility review
- Sign Contributor License Agreement (optional, for IP clarity)

**Recognition**:
- Listed in CONTRIBUTORS.md
- Contributor badge on GitHub
- Invited to quarterly contributor calls
- Input on roadmap priorities

**How to Join**:
- Start contributing! (See [CONTRIBUTING.md](CONTRIBUTING.md))
- After 3 merged PRs, you're automatically recognized
- No formal application needed

---

### Perimeter 3: Community Sandbox (Fully Open)
**Access Level**: Read + Fork
**Trust Level**: Public
**Members**: Everyone

**Permissions**:
- Read all code
- Fork repository
- Create issues
- Participate in public discussions
- Use all tools (browser extension, API, etc.)

**No Barriers**:
- No registration required (for most features)
- No approval needed
- No fees (free tier)
- No NDAs

**Responsibilities**:
- Follow Code of Conduct
- Respect licenses (MIT + Palimpsest v0.8)
- Don't abuse free tier limits

**Current Status**: ✅ Fully open

This is where everyone starts. Welcome!

---

## Trust Escalation Path

```
Community Sandbox (P3)
    ↓ (3+ quality contributions)
Contributor Sphere (P2)
    ↓ (6+ months sustained contribution + maintainer vote)
Maintainer Circle (P1)
```

### Escalation Criteria

**P3 → P2** (Automatic):
- 3+ merged pull requests
- All PRs passed review
- No Code of Conduct violations
- Minimum 30 days since first contribution

**P2 → P1** (Invitation):
- 6+ months active contribution
- Deep codebase knowledge
- Community engagement
- Code review participation
- Unanimous maintainer approval

### De-escalation

**Reasons**:
- Prolonged inactivity (6+ months)
- Code of Conduct violations
- Security negligence
- Breach of trust

**Process**:
- Private discussion among maintainers
- Attempt to resolve first
- Clear communication of concerns
- Opportunity to respond
- Vote by maintainers (2/3 majority for P2→P3, unanimous for P1→P2)

---

## Security Implications

### Perimeter 1 (Maintainer Circle)
- Access to production infrastructure
- Signing keys for releases
- Ability to publish packages
- Security vulnerability coordination
- **Risk**: Compromised account = full system access
- **Mitigation**: 2FA required, hardware keys recommended, regular access audits

### Perimeter 2 (Contributor Sphere)
- No production access
- Can propose code changes
- Changes reviewed before merge
- **Risk**: Malicious PR could slip through review
- **Mitigation**: All PRs reviewed by 2+ maintainers, automated security scanning

### Perimeter 3 (Community Sandbox)
- Read-only access to code
- Can run tools locally
- Free tier API access (rate limited)
- **Risk**: API abuse, vulnerability discovery
- **Mitigation**: Rate limiting, input validation, security.txt for responsible disclosure

---

## Access Control Matrix

| Resource | P1 (Maintainer) | P2 (Contributor) | P3 (Community) |
|----------|----------------|------------------|----------------|
| Read code | ✅ | ✅ | ✅ |
| Fork repo | ✅ | ✅ | ✅ |
| Create issues | ✅ | ✅ | ✅ |
| Create PRs | ✅ | ✅ | ❌ (must fork) |
| Merge PRs | ✅ | ❌ | ❌ |
| Publish releases | ✅ | ❌ | ❌ |
| Production access | ✅ | ❌ | ❌ |
| Security incidents | ✅ | ⚠️ (report only) | ⚠️ (report only) |
| Roadmap input | ✅ (decision) | ✅ (advisory) | ✅ (suggestions) |
| Private channels | ✅ | ✅ (contributor Discord) | ❌ |
| API free tier | ✅ | ✅ | ✅ (rate limited) |
| API paid tier | ✅ | ✅ | ✅ (self-service) |

---

## Examples

### Scenario 1: New User
Sarah discovers Accessibility Everywhere and wants to try it.

- **Current perimeter**: P3 (Community Sandbox)
- **Actions available**: Install browser extension, use dashboard, scan own sites
- **What she does**: Uses free tier, scans her website, finds 12 violations
- **Next step**: Might become a paid API customer OR contribute a fix

### Scenario 2: First Contribution
Alex found a bug and wants to fix it.

- **Current perimeter**: P3 (Community Sandbox)
- **Actions available**: Fork repo, fix bug, create PR
- **What he does**: Forks, fixes accessibility issue in React component, opens PR
- **Review process**: 2 maintainers review, request accessibility tests, approve
- **Result**: PR merged, Alex credited in CHANGELOG.md
- **Next step**: Still P3, but progress toward P2 (needs 2 more PRs)

### Scenario 3: Active Contributor
Maria has contributed 5 PRs over 3 months, all merged.

- **Current perimeter**: P2 (Contributor Sphere) - automatic promotion after 3rd PR
- **New privileges**: Invited to contributor Discord, early access to features
- **Actions available**: Same as before, plus input on roadmap, PR review
- **What she does**: Reviews other PRs, proposes new React component, joins quarterly call
- **Next step**: Continue contributing, might be invited to P1 in 3+ more months

### Scenario 4: Maintainer
David has been contributing for 9 months, knows codebase deeply.

- **Current perimeter**: P2 (Contributor Sphere)
- **Invitation**: Other maintainers vote unanimously to invite to P1
- **New role**: Maintainer Circle (P1)
- **New responsibilities**: PR review, release management, security coordination
- **New access**: Write access to main branch, production credentials, signing keys
- **Next step**: Formal onboarding, added to MAINTAINERS.md

---

## Why TPCF?

### Traditional Model Problems
- **Fully closed**: Stifles innovation, low external contributions
- **Fully open**: Security risks, quality control issues, maintainer burden
- **Binary (open/closed)**: Doesn't reflect real trust gradients

### TPCF Benefits
1. **Graduated trust**: Match access to demonstrated reliability
2. **Clear expectations**: Everyone knows what's required for each level
3. **Low barrier to entry**: Anyone can start in P3
4. **Security without gatekeeping**: Open contributions, controlled access
5. **Recognition**: Contributors get credit and privileges as they grow

### Inspired By
- Linux kernel contribution model
- Debian maintainer process
- Rust team structure
- Mozilla's module ownership

---

## Metrics

### Current Distribution (January 2024)
- **P1 (Maintainer)**: 1 (project founder)
- **P2 (Contributor)**: 0 (project just launched)
- **P3 (Community)**: Everyone else

### Goals (End of 2024)
- **P1**: 3-5 maintainers
- **P2**: 20+ active contributors
- **P3**: 10,000+ community members

---

## Changes to This Document

TPCF perimeter definitions may be updated by P1 (Maintainer Circle) consensus.

**Change log**:
- 2024-01-22: Initial TPCF definition
- (Future changes will be listed here)

**Propose changes**: Create a GitHub issue with label `governance`

---

## Contact

**Questions about TPCF**: governance@accessibility-everywhere.org

**Want to contribute**: See [CONTRIBUTING.md](CONTRIBUTING.md)

**Security issues**: security@accessibility-everywhere.org (see [SECURITY.md](SECURITY.md))

---

**Last updated**: 2024-01-22
**Version**: 1.0
**Status**: Active
