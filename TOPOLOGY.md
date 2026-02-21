<!-- SPDX-License-Identifier: PMPL-1.0-or-later -->
<!-- TOPOLOGY.md — Project architecture map and completion dashboard -->
<!-- Last updated: 2026-02-19 -->

# Accessibility Everywhere — Project Topology

## System Architecture

```
                        ┌─────────────────────────────────────────┐
                        │              USERS / CLIENTS            │
                        │      (Browser, CI/CD, CLI, API)         │
                        └───────────────────┬─────────────────────┘
                                            │
                                            ▼
                        ┌─────────────────────────────────────────┐
                        │           USER-FACING TOOLS             │
                        │  ┌───────────┐  ┌───────────────────┐  │
                        │  │ Browser   │  │ Testing Dashboard │  │
                        │  │ Extension │  │ (React/Vanilla JS)│  │
                        │  └─────┬─────┘  └────────┬──────────┘  │
                        │  ┌─────▼─────┐  ┌────────▼──────────┐  │
                        │  │ CLI Tool  │  │ GitHub Action     │  │
                        │  │ (Node.js) │  │                   │  │
                        │  └─────┬─────┘  └────────┬──────────┘  │
                        └────────│─────────────────│──────────────┘
                                 │                 │
                                 ▼                 ▼
                        ┌─────────────────────────────────────────┐
                        │           MONITORING API (NODE)         │
                        │      (Express, REST, Violation Rpt)     │
                        └───────────────────┬─────────────────────┘
                                            │
                                            ▼
                        ┌─────────────────────────────────────────┐
                        │           SCANNING ENGINE               │
                        │    (axe-core, Puppeteer, Playwright)    │
                        └───────────────────┬─────────────────────┘
                                            │
                                            ▼
                        ┌─────────────────────────────────────────┐
                        │             DATA LAYER                  │
                        │  ┌───────────┐  ┌───────────────────┐  │
                        │  │ ArangoDB  │  │ Cloudflare Pages  │  │
                        │  │ (Graph)   │  │    (Static)       │  │
                        │  └───────────┘  └───────────────────┘  │
                        └─────────────────────────────────────────┘

                        ┌─────────────────────────────────────────┐
                        │          REPO INFRASTRUCTURE            │
                        │  .machine_readable/ (STATE.a2ml)        │
                        │  packages/ (core, scanner, standards)   │
                        │  Justfile, docker-compose.yml           │
                        └─────────────────────────────────────────┘
```

## Completion Dashboard

```
COMPONENT                          STATUS              NOTES
─────────────────────────────────  ──────────────────  ─────────────────────────────────
USER TOOLS
  Browser Extension                 ██████████ 100%    Chrome & Firefox stable
  Testing Dashboard                 ██████████ 100%    Public scanner active
  CLI Tool (@a11y-everywhere/cli)   ██████████ 100%    Batch scanning verified
  GitHub Action                     ██████████ 100%    Marketplace v1 release

BACKEND & ENGINE
  Monitoring API                    ██████████ 100%    Violation analytics stable
  axe-core Scanner                  ██████████ 100%    Puppeteer integration verified
  Proposed Web Standards            ████████░░  80%    /.well-known spec refining

DATA & PACKAGES
  ArangoDB Models                   ██████████ 100%    Graph/Document schema stable
  packages/core                     ██████████ 100%    Shared models published
  packages/scanner                  ██████████ 100%    Programmatic API stable

REPO INFRASTRUCTURE
  Justfile                          ██████████ 100%    Full automation
  .machine_readable/                ██████████ 100%    A2ML status tracking
  Docker Compose                    ██████████ 100%    Full stack orchestration

─────────────────────────────────────────────────────────────────────────────
OVERALL:                            █████████░  ~90%   Phase 1 Foundation Complete
```

## Key Dependencies

```
Proposed Header ───► Browser Ext ───► Monitoring API
                                          │
                                          ▼
    axe-core ◄──────── Puppeteer ◄──── Scanner Pkg ────► ArangoDB
```

## Update Protocol

This file is maintained by both humans and AI agents. When updating:

1. **After completing a component**: Change its bar and percentage
2. **After adding a component**: Add a new row in the appropriate section
3. **After architectural changes**: Update the ASCII diagram
4. **Date**: Update the `Last updated` comment at the top of this file

Progress bars use: `█` (filled) and `░` (empty), 10 characters wide.
Percentages: 0%, 10%, 20%, ... 100% (in 10% increments).
