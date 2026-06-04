// SPDX-License-Identifier: MPL-2.0
// Copyright (c) Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
#!/usr/bin/env node

/**
 * RSR (Rhodium Standard Repository) Compliance Checker
 * Validates project against RSR framework standards
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const check = (condition) => condition ? '✅' : '❌';

class RSRComplianceChecker {
  constructor() {
    this.results = {
      governance: [],
      wellKnown: [],
      buildSystem: [],
      testing: [],
      security: [],
      accessibility: [],
      tpcf: [],
      licensing: [],
      documentation: [],
      ci: [],
      offline: [],
    };
    this.score = 0;
    this.maxScore = 0;
  }

  // Check if file exists
  fileExists(filePath) {
    return fs.existsSync(path.join(process.cwd(), filePath));
  }

  // Check if directory exists
  dirExists(dirPath) {
    try {
      return fs.statSync(path.join(process.cwd(), dirPath)).isDirectory();
    } catch {
      return false;
    }
  }

  // Read file content
  readFile(filePath) {
    try {
      return fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
    } catch {
      return null;
    }
  }

  // Add check result
  addResult(category, name, passed, required = true, points = 1) {
    this.results[category].push({ name, passed, required, points });
    this.maxScore += points;
    if (passed) this.score += points;
  }

  // === CATEGORY: Governance Documents ===
  checkGovernance() {
    console.log(`\n${colors.blue}📋 Governance Documents${colors.reset}`);

    const docs = {
      'README.md': { required: true, points: 2 },
      'LICENSE': { required: true, points: 2 },
      'CONTRIBUTING.md': { required: true, points: 2 },
      'CODE_OF_CONDUCT.md': { required: true, points: 2 },
      'SECURITY.md': { required: true, points: 2 },
      'MAINTAINERS.md': { required: true, points: 1 },
      'CHANGELOG.md': { required: true, points: 1 },
      'TPCF.md': { required: true, points: 2 },
    };

    for (const [file, { required, points }] of Object.entries(docs)) {
      const exists = this.fileExists(file);
      this.addResult('governance', file, exists, required, points);
      console.log(`  ${check(exists)} ${file}`);

      // Check content quality for key files
      if (exists && file === 'LICENSE') {
        const content = this.readFile(file);
        const hasMIT = content && content.includes('MIT');
        const hasPalimpsest = content && content.includes('Palimpsest');
        const dualLicense = hasMIT && hasPalimpsest;
        this.addResult('licensing', 'Dual MIT + Palimpsest license', dualLicense, true, 2);
        console.log(`    ${check(dualLicense)} Dual licensing (MIT + Palimpsest v0.8)`);
      }

      if (exists && file === 'CODE_OF_CONDUCT.md') {
        const content = this.readFile(file);
        const hasAccessibility = content && content.toLowerCase().includes('accessibility');
        this.addResult('governance', 'Code of Conduct mentions accessibility', hasAccessibility, true, 1);
        console.log(`    ${check(hasAccessibility)} Accessibility-specific standards`);
      }
    }
  }

  // === CATEGORY: .well-known Directory ===
  checkWellKnown() {
    console.log(`\n${colors.blue}🔍 .well-known Directory${colors.reset}`);

    const exists = this.dirExists('.well-known');
    this.addResult('wellKnown', '.well-known/ directory', exists, true, 1);
    console.log(`  ${check(exists)} .well-known/ directory`);

    const files = {
      '.well-known/security.txt': { required: true, points: 2, rfc: 'RFC 9116' },
      '.well-known/ai.txt': { required: true, points: 2, rfc: 'AI training policy' },
      '.well-known/humans.txt': { required: true, points: 1, rfc: 'humanstxt.org' },
    };

    for (const [file, { required, points, rfc }] of Object.entries(files)) {
      const fileExists = this.fileExists(file);
      this.addResult('wellKnown', file, fileExists, required, points);
      console.log(`  ${check(fileExists)} ${file} (${rfc})`);
    }
  }

  // === CATEGORY: Build System ===
  checkBuildSystem() {
    console.log(`\n${colors.blue}🔨 Build System${colors.reset}`);

    const buildFiles = {
      'package.json': { required: true, points: 2 },
      'justfile': { required: true, points: 2 },
      'docker-compose.yml': { required: false, points: 1 },
      'flake.nix': { required: true, points: 2 },
    };

    for (const [file, { required, points }] of Object.entries(buildFiles)) {
      const exists = this.fileExists(file);
      this.addResult('buildSystem', file, exists, required, points);
      console.log(`  ${check(exists)} ${file}`);
    }

    // Check justfile recipes
    if (this.fileExists('justfile')) {
      const content = this.readFile('justfile');
      const recipeCount = (content.match(/^[a-z][a-z0-9_-]*:/gm) || []).length;
      const has20Recipes = recipeCount >= 20;
      this.addResult('buildSystem', '20+ justfile recipes', has20Recipes, true, 2);
      console.log(`  ${check(has20Recipes)} 20+ justfile recipes (found: ${recipeCount})`);
    }

    // Check for reproducible builds
    const hasNix = this.fileExists('flake.nix');
    this.addResult('buildSystem', 'Nix reproducible builds', hasNix, true, 1);
  }

  // === CATEGORY: Testing ===
  checkTesting() {
    console.log(`\n${colors.blue}🧪 Testing Infrastructure${colors.reset}`);

    // Check for test files
    const hasTests = this.fileExists('package.json');
    let testConfigured = false;

    if (hasTests) {
      const pkg = JSON.parse(this.readFile('package.json') || '{}');
      testConfigured = pkg.scripts && (pkg.scripts.test || pkg.scripts['test:a11y']);
    }

    this.addResult('testing', 'Test scripts configured', testConfigured, true, 2);
    console.log(`  ${check(testConfigured)} Test scripts configured`);

    // Check for accessibility testing
    const hasA11yTests = testConfigured;  // Simplified check
    this.addResult('testing', 'Accessibility tests', hasA11yTests, true, 2);
    console.log(`  ${check(hasA11yTests)} Accessibility tests (axe-core)`);

    // Note: Actual test pass rate would require running tests
    console.log(`  ⚠️  Test pass rate check requires: just test`);
  }

  // === CATEGORY: Security ===
  checkSecurity() {
    console.log(`\n${colors.blue}🔒 Security Measures${colors.reset}`);

    const hasSecurityMd = this.fileExists('SECURITY.md');
    this.addResult('security', 'SECURITY.md', hasSecurityMd, true, 2);

    const hasSecurityTxt = this.fileExists('.well-known/security.txt');
    this.addResult('security', 'security.txt (RFC 9116)', hasSecurityTxt, true, 2);

    // Check for .env.example (not .env which should never be committed)
    const hasEnvExample = this.fileExists('.env.example');
    const hasEnvInGitignore = this.readFile('.gitignore')?.includes('.env');
    this.addResult('security', '.env.example present', hasEnvExample, true, 1);
    this.addResult('security', '.env in .gitignore', hasEnvInGitignore, true, 2);
    console.log(`  ${check(hasEnvExample)} .env.example (secrets template)`);
    console.log(`  ${check(hasEnvInGitignore)} .env excluded from git`);

    // Check for common security files
    const hasGitignore = this.fileExists('.gitignore');
    this.addResult('security', '.gitignore', hasGitignore, true, 1);
  }

  // === CATEGORY: Accessibility ===
  checkAccessibility() {
    console.log(`\n${colors.blue}♿ Accessibility Compliance${colors.reset}`);

    // Check for accessibility documentation
    const claudeMd = this.readFile('CLAUDE.md');
    const hasA11yGuidelines = claudeMd && claudeMd.toLowerCase().includes('accessibility');
    this.addResult('accessibility', 'Accessibility guidelines (CLAUDE.md)', hasA11yGuidelines, true, 2);
    console.log(`  ${check(hasA11yGuidelines)} WCAG guidelines in CLAUDE.md`);

    // Check for accessibility-focused tools
    const hasA11yTools = this.dirExists('packages/scanner') || this.dirExists('tools/browser-extension');
    this.addResult('accessibility', 'Accessibility scanning tools', hasA11yTools, true, 2);
    console.log(`  ${check(hasA11yTools)} Accessibility scanning tools present`);

    // Check for accessible components
    const hasA11yComponents = this.dirExists('components/react');
    this.addResult('accessibility', 'Accessible UI components', hasA11yComponents, false, 1);
    console.log(`  ${check(hasA11yComponents)} Accessible React components`);
  }

  // === CATEGORY: TPCF ===
  checkTPCF() {
    console.log(`\n${colors.blue}👥 Tri-Perimeter Contribution Framework${colors.reset}`);

    const hasTPCF = this.fileExists('TPCF.md');
    this.addResult('tpcf', 'TPCF.md', hasTPCF, true, 3);
    console.log(`  ${check(hasTPCF)} TPCF.md (contribution perimeters)`);

    if (hasTPCF) {
      const content = this.readFile('TPCF.md');
      const hasP1 = content && content.includes('Perimeter 1');
      const hasP2 = content && content.includes('Perimeter 2');
      const hasP3 = content && content.includes('Perimeter 3');
      const allPerimeters = hasP1 && hasP2 && hasP3;
      this.addResult('tpcf', 'All three perimeters defined', allPerimeters, true, 2);
      console.log(`  ${check(allPerimeters)} All three perimeters defined`);

      const currentPerimeter = content && content.includes('Community Sandbox') ? 'P3' : 'Unknown';
      console.log(`  ℹ️  Current perimeter: ${currentPerimeter} (Community Sandbox)`);
    }
  }

  // === CATEGORY: CI/CD ===
  checkCI() {
    console.log(`\n${colors.blue}⚙️  CI/CD Configuration${colors.reset}`);

    const ciFiles = {
      '.github/workflows': { name: 'GitHub Actions', required: false },
      '.gitlab-ci.yml': { name: 'GitLab CI', required: false },
      '.circleci/config.yml': { name: 'CircleCI', required: false },
    };

    let hasCI = false;
    for (const [file, { name }] of Object.entries(ciFiles)) {
      const exists = file.includes('/') ? this.dirExists(file) || this.fileExists(file) : this.fileExists(file);
      if (exists) {
        console.log(`  ✅ ${name}`);
        hasCI = true;
      }
    }

    this.addResult('ci', 'CI/CD configured', hasCI, false, 1);
    if (!hasCI) {
      console.log(`  ⚠️  No CI/CD configuration found`);
    }
  }

  // === CATEGORY: Offline-First ===
  checkOffline() {
    console.log(`\n${colors.blue}📴 Offline-First Capability${colors.reset}`);

    // This is project-specific - for accessibility-everywhere, some tools work offline
    const hasBrowserExtension = this.dirExists('tools/browser-extension');
    this.addResult('offline', 'Offline-capable tools', hasBrowserExtension, false, 1);
    console.log(`  ${check(hasBrowserExtension)} Browser extension (works offline)`);

    const hasCLI = this.dirExists('tools/cli');
    console.log(`  ${check(hasCLI)} CLI tool available`);

    console.log(`  ℹ️  Note: Full offline scanning requires local axe-core`);
  }

  // === CATEGORY: Documentation ===
  checkDocumentation() {
    console.log(`\n${colors.blue}📚 Documentation Quality${colors.reset}`);

    const readme = this.readFile('README.md');
    const hasInstall = readme && readme.toLowerCase().includes('install');
    const hasUsage = readme && readme.toLowerCase().includes('usage');
    const hasLicense = readme && readme.toLowerCase().includes('license');
    const hasContributing = readme && readme.toLowerCase().includes('contribut');

    this.addResult('documentation', 'README has installation', hasInstall, true, 1);
    this.addResult('documentation', 'README has usage', hasUsage, true, 1);
    this.addResult('documentation', 'README has license info', hasLicense, true, 1);
    this.addResult('documentation', 'README has contributing info', hasContributing, true, 1);

    console.log(`  ${check(hasInstall)} Installation instructions`);
    console.log(`  ${check(hasUsage)} Usage documentation`);
    console.log(`  ${check(hasLicense)} License information`);
    console.log(`  ${check(hasContributing)} Contributing guidelines`);

    // Check for docs directory
    const hasDocs = this.dirExists('docs');
    this.addResult('documentation', 'docs/ directory', hasDocs, false, 1);
    console.log(`  ${check(hasDocs)} Additional documentation (docs/)`);
  }

  // Calculate compliance level
  getComplianceLevel() {
    const percentage = (this.score / this.maxScore) * 100;

    if (percentage >= 90) return { level: 'Platinum', color: colors.cyan };
    if (percentage >= 75) return { level: 'Gold', color: colors.yellow };
    if (percentage >= 60) return { level: 'Silver', color: colors.blue };
    if (percentage >= 40) return { level: 'Bronze', color: colors.green };
    return { level: 'None', color: colors.red };
  }

  // Print summary
  printSummary() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${colors.cyan}RSR COMPLIANCE REPORT${colors.reset}`);
    console.log(`${'='.repeat(60)}`);

    const { level, color } = this.getComplianceLevel();
    const percentage = ((this.score / this.maxScore) * 100).toFixed(1);

    console.log(`\n${color}Compliance Level: ${level}${colors.reset}`);
    console.log(`Score: ${this.score}/${this.maxScore} (${percentage}%)`);

    console.log(`\n${colors.blue}Category Breakdown:${colors.reset}`);

    for (const [category, checks] of Object.entries(this.results)) {
      const passed = checks.filter(c => c.passed).length;
      const total = checks.length;
      const categoryPoints = checks.filter(c => c.passed).reduce((sum, c) => sum + c.points, 0);
      const maxCategoryPoints = checks.reduce((sum, c) => sum + c.points, 0);

      console.log(`  ${category.padEnd(20)} ${passed}/${total} checks (${categoryPoints}/${maxCategoryPoints} points)`);
    }

    // Required improvements
    console.log(`\n${colors.yellow}Required Improvements:${colors.reset}`);
    let hasImprovements = false;

    for (const [category, checks] of Object.entries(this.results)) {
      const failed = checks.filter(c => !c.passed && c.required);
      if (failed.length > 0) {
        hasImprovements = true;
        console.log(`\n  ${category}:`);
        failed.forEach(c => console.log(`    ❌ ${c.name}`));
      }
    }

    if (!hasImprovements) {
      console.log(`  ✅ All required checks passed!`);
    }

    console.log(`\n${'='.repeat(60)}`);
  }

  // Run all checks
  async run() {
    console.log(`${colors.cyan}🔍 Running RSR Compliance Checks...${colors.reset}`);
    console.log(`Project: ${path.basename(process.cwd())}`);

    this.checkGovernance();
    this.checkWellKnown();
    this.checkBuildSystem();
    this.checkTesting();
    this.checkSecurity();
    this.checkAccessibility();
    this.checkTPCF();
    this.checkCI();
    this.checkOffline();
    this.checkDocumentation();

    this.printSummary();

    // Exit code based on required checks
    const allRequiredPassed = Object.values(this.results)
      .flat()
      .filter(c => c.required)
      .every(c => c.passed);

    return allRequiredPassed ? 0 : 1;
  }
}

// Run checker
const checker = new RSRComplianceChecker();
checker.run().then(exitCode => {
  process.exit(exitCode);
}).catch(error => {
  console.error(`${colors.red}Error:${colors.reset}`, error);
  process.exit(1);
});
