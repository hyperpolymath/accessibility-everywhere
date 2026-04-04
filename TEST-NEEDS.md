# TEST-NEEDS.md - Accessibility Everywhere Testing Status

## Current Test Coverage Analysis

### Repository Structure
- **CLI Tool**: `tools/cli/` - TypeScript (Node.js based, using commander, chalk, ora)
- **Monitoring API**: `tools/monitoring-api/` - Express.js API with 6 route modules
- **GitHub Action**: `tools/github-action/` - GitHub Actions integration
- **Browser Extension**: `tools/browser-extension/` - Browser extension (archived)
- **WordPress Plugin**: `tools/wordpress-plugin/` - WordPress integration (archived)
- **Stale Packages**: `tools/stale/` - Archived code (NOT TESTED)

### Existing Test Infrastructure
- Minimal FFI tests at `ffi/zig/test/integration_test.zig` (Zig-based)
- Fuzz testing stub at `tests/fuzz/` (no files)
- No Deno/TypeScript test files currently present

### Critical Gaps (CRG C Requirements)

#### Unit Tests - MISSING
- [ ] CLI command parsing and validation
- [ ] GitHub Action input validation
- [ ] Monitoring API route handlers
- [ ] Badge SVG generation logic

#### Smoke Tests - MISSING
- [ ] Server startup and health checks
- [ ] Route endpoint availability
- [ ] Database connection initialization

#### Build Tests - MISSING
- [ ] All TypeScript compiles without errors
- [ ] No import resolution failures
- [ ] Type checking passes

#### P2P Property Tests - MISSING
- [ ] URL validation properties (any valid URL → valid report shape)
- [ ] Score invariants (always 0-100)
- [ ] Violation severity enumeration
- [ ] Determinism verification (same input → same violations)

#### E2E Tests - MISSING
- [ ] Complete scan workflow
- [ ] Badge generation end-to-end
- [ ] Statistics aggregation pipeline
- [ ] Error handling paths (invalid URLs, malformed requests)

#### Reflexive Tests - MISSING
- [ ] API response schema compliance
- [ ] Accessibility report structure validation

#### Contract Tests - MISSING
- [ ] API request/response contracts
- [ ] GitHub Action input/output contracts
- [ ] Database operation contracts

#### Aspect Tests - MISSING
- [ ] SSRF prevention (blocking local IPs)
- [ ] XSS input sanitization
- [ ] Request size limits
- [ ] Error message clarity

#### Benchmarks - MISSING
- [ ] API request throughput
- [ ] Badge generation performance
- [ ] Statistics aggregation speed
- [ ] CLI tool execution time

## Tech Stack Notes

### Language Status
⚠️  **ISSUE**: Repository uses TypeScript + Node.js (banned per hyperpolymath standards)
- Should use **Deno** + Deno-compatible code
- Tests will be written in **Deno** (standard for hyperpolymath)
- All tests use Deno's built-in test runner and standard library

### Test Framework
- **Deno Test**: Built-in test runner (`deno test`)
- **No external test frameworks** (keep Deno-native)
- **Standard library asserts**: `std/assert`

### Routes Requiring Tests

#### Monitoring API Routes
1. **POST /v1/scan** - Scan URL, store results
2. **GET /v1/scan/:scanId** - Retrieve scan by ID
3. **POST /v1/violations** - Report violation
4. **GET /v1/violations/common** - Common violations list
5. **GET /v1/violations/site/:siteKey** - Site violations
6. **PATCH /v1/violations/:violationId/fixed** - Mark fixed
7. **GET /v1/badge/:domain** - Get badge (JSON or SVG)
8. **GET /v1/stats** - Global statistics
9. **GET /v1/stats/site/:siteKey** - Site statistics
10. **GET /health** - Health check

#### CLI Commands
1. `scan` - Scan single URL
2. `ci` - CI/CD scan with thresholds
3. `batch` - Batch scan from file
4. `--help` - Usage information
5. `--version` - Version string

#### GitHub Action
1. Input validation (url, wcag-level, fail-on-violations, etc.)
2. Output generation (score, violations, passes, report-url)
3. PR comment creation (if enabled)
4. Job summary generation

## Test Organization

```
tools/
├── cli/
│   ├── src/
│   │   └── cli.ts
│   └── tests/                    [NEW]
│       └── cli_test.ts
├── monitoring-api/
│   ├── src/
│   │   └── routes/
│   └── tests/                    [NEW]
│       ├── e2e/
│       │   └── api_test.ts
│       ├── property/
│       │   └── scanner_properties_test.ts
│       ├── aspect/
│       │   └── security_test.ts
│       └── benches/
│           └── api_bench.ts
└── github-action/
    └── tests/                    [NEW]
        └── action_test.ts
```

## Success Criteria

✅ **CRG C Grade Achieved When:**
1. All 7 test categories implemented (unit, smoke, build, P2P, E2E, reflexive, contract, aspect)
2. All tests pass with `deno test tools/`
3. Benchmarks baseline established
4. TEST-NEEDS.md updated with completion status
5. STATE.a2ml updated with test coverage metrics
6. Code commits with proper SPDX headers (PMPL-1.0-or-later)

## Notes
- Mock the scanner to avoid real HTTP requests in tests
- SSRF blocking is CRITICAL for aspect tests
- No external URL scanning in test suite
- Tests should be deterministic and repeatable
- Use consistent error response format per API design
