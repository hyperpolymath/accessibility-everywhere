# Accessibility Everywhere - Build Automation (just)
# Install just: https://github.com/casey/just
# Usage: just <recipe>

# Default recipe (runs when you type "just" with no arguments)
import? "contractile.just"

default:
    @just --list

# Show this help message
help:
    @just --list --unsorted

# === Development ===

# Install all dependencies
install:
    npm install
    @echo "✓ Dependencies installed"

# Build all packages and tools
build:
    npm run build --workspaces
    @echo "✓ All packages built"

# Run development servers
dev:
    docker-compose up

# Run development servers in background
dev-bg:
    docker-compose up -d
    @echo "✓ Services running:"
    @echo "  - Dashboard: http://localhost:8080"
    @echo "  - API: http://localhost:3000"
    @echo "  - ArangoDB: http://localhost:8529"

# Stop development servers
dev-stop:
    docker-compose down

# === Testing ===

# Run all tests
test:
    npm test --workspaces

# Run tests with coverage
test-coverage:
    npm test --workspaces -- --coverage

# Run linter
lint:
    npm run lint --workspaces --if-present

# Fix linting issues
lint-fix:
    npm run lint:fix --workspaces --if-present

# Run accessibility tests (axe-core)
test-a11y:
    @echo "Running accessibility tests..."
    npm run test:a11y --workspaces --if-present

# === Database ===

# Setup ArangoDB
db-setup:
    node scripts/setup-arangodb.js

# Reset database (WARNING: destroys all data)
db-reset:
    @echo "⚠️  This will delete all data. Press Ctrl+C to cancel..."
    @sleep 3
    docker-compose down -v
    docker-compose up -d arangodb
    @sleep 5
    node scripts/setup-arangodb.js

# === Building ===

# Build Docker images
docker-build:
    docker-compose build

# Build and start Docker stack
docker-up:
    docker-compose up --build

# === Deployment ===

# Deploy to production
deploy-prod:
    ./scripts/deploy.sh production

# Deploy to staging
deploy-staging:
    ./scripts/deploy.sh staging

# Deploy to development
deploy-dev:
    ./scripts/deploy.sh development

# === Packages ===

# Build core package
build-core:
    cd packages/core && npm run build

# Build scanner package
build-scanner:
    cd packages/scanner && npm run build

# Build React components
build-react:
    cd components/react && npm run build

# === Tools ===

# Package browser extension
package-extension:
    cd tools/browser-extension && npm run package

# Build GitHub Action
build-action:
    cd tools/github-action && npm run build

# Build CLI tool
build-cli:
    cd tools/cli && npm run build

# === Publishing ===

# Publish npm packages (requires npm login)
publish-npm:
    npm publish --workspace packages/core --access public
    npm publish --workspace packages/scanner --access public
    npm publish --workspace components/react --access public
    npm publish --workspace tools/cli --access public

# === Quality ===

# Run all quality checks
quality: lint test test-a11y
    @echo "✓ All quality checks passed"

# Format all code
format:
    npx prettier --write "**/*.{js,ts,tsx,json,md,yml,yaml}"

# Type check all TypeScript
typecheck:
    npm run typecheck --workspaces --if-present

# === Security ===

# Audit dependencies for vulnerabilities
audit:
    npm audit
    npm audit --workspaces

# Fix auto-fixable vulnerabilities
audit-fix:
    npm audit fix
    npm audit fix --workspaces

# === Documentation ===

# Generate API documentation
docs-api:
    npx typedoc --out docs/api

# Build documentation site
docs-build:
    @echo "Building documentation..."
    @mkdir -p docs/_site
    @# Convert AsciiDoc files to HTML
    @for file in *.adoc docs/*.adoc; do \
        if [ -f "$$file" ]; then \
            echo "Converting $$file..."; \
            asciidoctor -D docs/_site "$$file" 2>/dev/null || echo "  (skipped - asciidoctor not installed)"; \
        fi; \
    done
    @# Copy markdown files
    @for file in docs/*.md; do \
        if [ -f "$$file" ]; then \
            cp "$$file" docs/_site/ 2>/dev/null || true; \
        fi; \
    done
    @# Copy static assets
    @cp -r docs/*.md docs/_site/ 2>/dev/null || true
    @cp README.adoc docs/_site/index.adoc 2>/dev/null || true
    @echo "✓ Documentation built in docs/_site/"

# Serve documentation locally
docs-serve:
    @echo "Serving documentation..."
    @just docs-build
    @echo "Starting server at http://localhost:8000"
    @echo "Press Ctrl+C to stop"
    @cd docs/_site && python3 -m http.server 8000 2>/dev/null || \
        (cd docs/_site && python -m SimpleHTTPServer 8000 2>/dev/null) || \
        (cd docs/_site && deno run --allow-net --allow-read https://deno.land/std/http/file_server.ts) || \
        echo "Error: No suitable HTTP server found (python3, python, or deno required)"

# === Cleanup ===

# Clean build artifacts
clean:
    find . -name "node_modules" -type d -prune -exec rm -rf {} +
    find . -name "dist" -type d -prune -exec rm -rf {} +
    find . -name "build" -type d -prune -exec rm -rf {} +
    find . -name "*.log" -type f -delete
    @echo "✓ Cleaned build artifacts"

# Clean Docker volumes
clean-docker:
    docker-compose down -v
    docker system prune -f

# === RSR Compliance ===

# Validate RSR compliance
validate-rsr:
    @echo "🔍 Validating RSR compliance..."
    @just check-governance
    @just check-well-known
    @just check-build-system
    @just check-tests
    @echo "✅ RSR compliance validated"

# Check governance documents
check-governance:
    @echo "Checking governance documents..."
    @test -f README.md || (echo "❌ README.md missing" && exit 1)
    @test -f LICENSE || (echo "❌ LICENSE missing" && exit 1)
    @test -f CONTRIBUTING.md || (echo "❌ CONTRIBUTING.md missing" && exit 1)
    @test -f CODE_OF_CONDUCT.md || (echo "❌ CODE_OF_CONDUCT.md missing" && exit 1)
    @test -f SECURITY.md || (echo "❌ SECURITY.md missing" && exit 1)
    @test -f MAINTAINERS.md || (echo "❌ MAINTAINERS.md missing" && exit 1)
    @test -f CHANGELOG.md || (echo "❌ CHANGELOG.md missing" && exit 1)
    @echo "✅ All governance documents present"

# Check .well-known directory
check-well-known:
    @echo "Checking .well-known directory..."
    @test -f .well-known/security.txt || (echo "❌ security.txt missing" && exit 1)
    @test -f .well-known/ai.txt || (echo "❌ ai.txt missing" && exit 1)
    @test -f .well-known/humans.txt || (echo "❌ humans.txt missing" && exit 1)
    @echo "✅ All .well-known files present"

# Check build system
check-build-system:
    @echo "Checking build system..."
    @test -f justfile || (echo "❌ justfile missing" && exit 1)
    @test -f package.json || (echo "❌ package.json missing" && exit 1)
    @test -f docker-compose.yml || (echo "❌ docker-compose.yml missing" && exit 1)
    @echo "✅ Build system complete"

# Check tests exist
check-tests:
    @echo "Checking test infrastructure..."
    @# Check for test directories
    @test_dirs=0; \
    for dir in tests test __tests__ spec; do \
        if [ -d "$$dir" ] || [ -d "packages/*/$$dir" ] || [ -d "components/*/$$dir" ]; then \
            test_dirs=$$((test_dirs + 1)); \
        fi; \
    done; \
    if [ $$test_dirs -eq 0 ]; then \
        echo "⚠️  No test directories found (tests/, test/, __tests__, spec/)"; \
    else \
        echo "✅ Found $$test_dirs test directories"; \
    fi
    @# Check for test files
    @test_files=$$(find . -name "*.test.*" -o -name "*.spec.*" -o -name "test_*.py" -o -name "*_test.go" 2>/dev/null | grep -v node_modules | wc -l); \
    if [ "$$test_files" -eq 0 ]; then \
        echo "⚠️  No test files found"; \
    else \
        echo "✅ Found $$test_files test files"; \
    fi
    @# Check for test configuration
    @if [ -f "jest.config.js" ] || [ -f "jest.config.ts" ] || [ -f "vitest.config.ts" ] || [ -f "pytest.ini" ] || [ -f "phpunit.xml" ]; then \
        echo "✅ Test configuration found"; \
    else \
        echo "⚠️  No test configuration found"; \
    fi
    @# Check for test scripts in package.json
    @if grep -q '"test"' package.json 2>/dev/null; then \
        echo "✅ Test script configured in package.json"; \
    else \
        echo "⚠️  No test script in package.json"; \
    fi

# === Utility ===

# Show project status
status:
    @echo "📊 Accessibility Everywhere Status"
    @echo "=================================="
    @echo ""
    @echo "Git branch: $(git branch --show-current)"
    @echo "Git status: $(git status --short | wc -l) files changed"
    @echo ""
    @echo "Docker containers:"
    @docker-compose ps
    @echo ""
    @echo "Node modules installed: $(test -d node_modules && echo "✓" || echo "✗")"
    @echo "Packages built: $(test -d packages/core/dist && echo "✓" || echo "✗")"

# Watch for changes and rebuild
watch:
    npm run dev --workspaces

# === CI/CD ===

# Run CI pipeline locally
ci: install lint typecheck test build
    @echo "✅ CI pipeline completed successfully"

# Pre-commit checks
pre-commit: lint-fix typecheck test-a11y
    @echo "✅ Pre-commit checks passed"

# Pre-push checks
pre-push: quality build
    @echo "✅ Pre-push checks passed"

# Synchronize A2ML metadata to SCM (Shadow Sync)
sync-metadata:
    #!/usr/bin/env bash
    echo "Synchronizing metadata (A2ML -> SCM)..."
    if [ -f .machine_readable/STATE.a2ml ]; then
        COMPLETION=$(grep "completion-percentage:" .machine_readable/STATE.a2ml | awk '{print $2}')
        sed -i "s/(overall-completion [0-9]\+)/(overall-completion $COMPLETION)/" .machine_readable/STATE.scm
        echo "✓ Metadata synchronized"
    fi

# --- SECURITY ---

# Run security audit suite
security:
    @echo "=== Security Audit ==="
    @command -v gitleaks >/dev/null && gitleaks detect --source . --verbose || echo "gitleaks not found"
    @command -v trivy >/dev/null && trivy fs --severity HIGH,CRITICAL . || echo "trivy not found"
    @echo "Security audit complete"

# Scan for vulnerabilities in dependencies (gitleaks/trivy)
audit-deps:
    @echo "=== Dependency Audit ==="
    @npm audit --workspaces
    @echo "Dependency audit complete"

# Run panic-attacker pre-commit scan
assail:
    @command -v panic-attack >/dev/null 2>&1 && panic-attack assail . || echo "panic-attack not found — install from https://github.com/hyperpolymath/panic-attacker"

# ═══════════════════════════════════════════════════════════════════════════════
# ONBOARDING & DIAGNOSTICS
# ═══════════════════════════════════════════════════════════════════════════════

# Check all required toolchain dependencies and report health
doctor:
    #!/usr/bin/env bash
    echo "═══════════════════════════════════════════════════"
    echo "  Accessibility Everywhere Doctor — Toolchain Health Check"
    echo "═══════════════════════════════════════════════════"
    echo ""
    PASS=0; FAIL=0; WARN=0
    check() {
        local name="$1" cmd="$2" min="$3"
        if command -v "$cmd" >/dev/null 2>&1; then
            VER=$("$cmd" --version 2>&1 | head -1)
            echo "  [OK]   $name — $VER"
            PASS=$((PASS + 1))
        else
            echo "  [FAIL] $name — not found (need $min+)"
            FAIL=$((FAIL + 1))
        fi
    }
    check "just"              just      "1.25" 
    check "git"               git       "2.40" 
    check "Deno"              deno      "2.0" 
    check "ReScript (resc)"   rescript  "12.0" 
    check "Zig"               zig       "0.13" 
# Optional tools
if command -v panic-attack >/dev/null 2>&1; then
    echo "  [OK]   panic-attack — available"
    PASS=$((PASS + 1))
else
    echo "  [WARN] panic-attack — not found (pre-commit scanner)"
    WARN=$((WARN + 1))
fi
    echo ""
    echo "  Result: $PASS passed, $FAIL failed, $WARN warnings"
    if [ "$FAIL" -gt 0 ]; then
        echo "  Run 'just heal' to attempt automatic repair."
        exit 1
    fi
    echo "  All required tools present."

# Attempt to automatically install missing tools
heal:
    #!/usr/bin/env bash
    echo "═══════════════════════════════════════════════════"
    echo "  Accessibility Everywhere Heal — Automatic Tool Installation"
    echo "═══════════════════════════════════════════════════"
    echo ""
if ! command -v deno >/dev/null 2>&1; then
    echo "Installing Deno..."
    curl -fsSL https://deno.land/install.sh | sh
fi
# Install Deno dependencies
echo "Installing Deno dependencies..."
deno install 2>/dev/null || true
if ! command -v just >/dev/null 2>&1; then
    echo "Installing just..."
    cargo install just 2>/dev/null || echo "Install just from https://just.systems"
fi
    echo ""
    echo "Heal complete. Run 'just doctor' to verify."

# Guided tour of the project structure and key concepts
tour:
    #!/usr/bin/env bash
    echo "═══════════════════════════════════════════════════"
    echo "  Accessibility Everywhere — Guided Tour"
    echo "═══════════════════════════════════════════════════"
    echo ""
    echo '> Making web accessibility a search engine ranking factor'
    echo ""
    echo "Key directories:"
    echo "  src/                      Source code" 
    echo "  ffi/                      Foreign function interface (Zig)" 
    echo "  src/abi/                  Idris2 ABI definitions" 
    echo "  docs/                     Documentation" 
    echo "  tests/                    Test suite" 
    echo "  .github/workflows/        CI/CD workflows" 
    echo "  contractiles/             Must/Trust/Dust contracts" 
    echo "  .machine_readable/        Machine-readable metadata" 
    echo "  examples/                 Usage examples" 
    echo ""
    echo "Quick commands:"
    echo "  just doctor    Check toolchain health"
    echo "  just heal      Fix missing tools"
    echo "  just help-me   Common workflows"
    echo "  just default   List all recipes"
    echo ""
    echo "Read more: README.adoc, EXPLAINME.adoc"

# Show help for common workflows
help-me:
    #!/usr/bin/env bash
    echo "═══════════════════════════════════════════════════"
    echo "  Accessibility Everywhere — Common Workflows"
    echo "═══════════════════════════════════════════════════"
    echo ""
echo "FIRST TIME SETUP:"
echo "  just doctor           Check toolchain"
echo "  just heal             Fix missing tools"
echo "" 
    echo "DEVELOPMENT:" 
    echo "  deno task dev         Development server" 
    echo "  deno test             Run tests" 
    echo "" 
echo "PRE-COMMIT:"
echo "  just assail           Run panic-attacker scan"
echo ""
echo "LEARN:"
echo "  just tour             Guided project tour"
echo "  just default          List all recipes" 


# Print the current CRG grade (reads from READINESS.md '**Current Grade:** X' line)
crg-grade:
    @grade=$$(grep -oP '(?<=\*\*Current Grade:\*\* )[A-FX]' READINESS.md 2>/dev/null | head -1); \
    [ -z "$$grade" ] && grade="X"; \
    echo "$$grade"

# Generate a shields.io badge markdown for the current CRG grade
# Looks for '**Current Grade:** X' in READINESS.md; falls back to X
crg-badge:
    @grade=$$(grep -oP '(?<=\*\*Current Grade:\*\* )[A-FX]' READINESS.md 2>/dev/null | head -1); \
    [ -z "$$grade" ] && grade="X"; \
    case "$$grade" in \
      A) color="brightgreen" ;; B) color="green" ;; C) color="yellow" ;; \
      D) color="orange" ;; E) color="red" ;; F) color="critical" ;; \
      *) color="lightgrey" ;; esac; \
    echo "[![CRG $$grade](https://img.shields.io/badge/CRG-$$grade-$$color?style=flat-square)](https://github.com/hyperpolymath/standards/tree/main/component-readiness-grades)"
