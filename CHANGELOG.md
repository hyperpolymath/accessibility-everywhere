<!--
SPDX-License-Identifier: MPL-2.0
SPDX-FileCopyrightText: 2026 Jonathan D.A. Jewell (hyperpolymath)
-->

# Changelog

All notable changes to `accessibility-everywhere` will be documented in this file.

This file is generated from conventional commits by the
[`changelog-reusable.yml`](https://github.com/hyperpolymath/standards/blob/main/.github/workflows/changelog-reusable.yml)
workflow (`hyperpolymath/standards#206`). Adopt the workflow in this repo's CI to keep this file in sync automatically — see
[`templates/cliff.toml`](https://github.com/hyperpolymath/standards/blob/main/templates/cliff.toml)
for the canonical config.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
this project aims to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- feat(safe-dom): add minimal SafeDOM package and runnable example (#26)
- feat(rescript): reconcile migration onto main
- feat(affinescript): step (a) — design lock-in for Node-bound packages (#16)
- feat(react): pilot AffineScript port of Button per migration playbook (#15)
- feat(stapeln): add selur-compose.toml Stapeln service definition
- feat(crg): add crg-grade and crg-badge justfile recipes
- feat: Add comprehensive test suite for CRG C grade
- feat: add stapeln.toml container definition
- feat: deploy UX Manifesto infrastructure
- feat: add CLADE.a2ml — clade taxonomy declaration

### Fixed

- fix(licence): #3 Tranche 2 — clear scaffold-placeholder leak (accessibility-everywhere) (#39)
- fix(affine): migrate record literals to #{ } (affinescript#218) (#38)
- fix(ci): bump a2ml/k9-validate-action pins to canonical (#35)
- fix(ci): sync hypatia-scan.yml to canonical (#34)
- fix(ci): adopt canonical hypatia-scan.yml (#31)
- fix(ci): Phase-2 fleet submission must not fail the security gate (#30)
- fix(ci): hypatia-scan workdir (${{ env.HOME }} resolves empty) (#29)
- fix(ci): rsr-antipattern.yml duplicate heredoc (#27)
- fix(scorecard): enforce granular permissions and add fuzzing placeholder
- fix(ci): Resolve workflow-linter self-matching and metadata issues

### Documentation

- docs(claude): TypeScript Exemptions table for documented TS files (#19)
- docs: substantive CRG C annotation (EXPLAINME.adoc)
- docs: add EXPLAINME.adoc — prove-it file backing README claims
- docs: add checkpoint files for state tracking

### CI

- ci: redistribute concurrency-cancel guard to read-only check workflows (#37)
- ci: bump actions/upload-artifact SHA to current v4 (#24)
- ci: bump actions/upload-artifact SHA to current v4 (#23)
- ci: SHA-pin hyperpolymath validate-actions in dogfood-gate
- ci(antipattern): fix top-level dir + benchmark/lsp filename matching (#18)

## Pre-history

Prior commits to this file's introduction are recorded in git history but not formally classified into Keep-a-Changelog sections. To backfill, run `git cliff -o CHANGELOG.md` locally using the canonical [`cliff.toml`](https://github.com/hyperpolymath/standards/blob/main/templates/cliff.toml) — this is one-shot mechanical work.

---

<!-- This file was seeded by the 2026-05-26 estate tech-debt audit follow-up (Row-2 Phase 3); see [`hyperpolymath/standards/docs/audits/2026-05-26-estate-documentation-debt.md`](https://github.com/hyperpolymath/standards/blob/main/docs/audits/2026-05-26-estate-documentation-debt.md). -->
