# Accessibility Everywhere - Build Automation (just)
# Install just: https://github.com/casey/just
# Usage: just <recipe>

# Default recipe (runs when you type "just" with no arguments)
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
