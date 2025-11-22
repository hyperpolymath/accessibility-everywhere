import * as core from '@actions/core';
import * as github from '@actions/github';
import { createScanner } from '@accessibility-everywhere/scanner';

async function run() {
  try {
    // Get inputs
    const url = core.getInput('url', { required: true });
    const wcagLevel = core.getInput('wcag-level') as 'A' | 'AA' | 'AAA';
    const failOnViolations = core.getInput('fail-on-violations') === 'true';
    const minScore = parseInt(core.getInput('min-score') || '0');
    const commentPR = core.getInput('comment-pr') === 'true';
    const githubToken = core.getInput('github-token');

    core.info(`Scanning ${url} for WCAG ${wcagLevel} compliance...`);

    // Run scan
    const scanner = createScanner();
    const result = await scanner.scan({
      url,
      wcagLevel,
      screenshot: false,
    });

    // Set outputs
    core.setOutput('score', result.score);
    core.setOutput('violations', result.violations.length);
    core.setOutput('passes', result.passes.length);
    core.setOutput('report-url', `https://accessibility-everywhere.org/report?url=${encodeURIComponent(url)}`);

    // Generate summary
    const summary = generateSummary(result, url, wcagLevel);
    core.summary.addRaw(summary).write();

    // Post PR comment if requested
    if (commentPR && githubToken && github.context.payload.pull_request) {
      await postPRComment(githubToken, result, url, wcagLevel);
    }

    // Log results
    core.info(`\n${'='.repeat(60)}`);
    core.info(`Accessibility Score: ${result.score}/100`);
    core.info(`Violations: ${result.violations.length}`);
    core.info(`Passes: ${result.passes.length}`);
    core.info(`Incomplete: ${result.incomplete.length}`);
    core.info(`${'='.repeat(60)}\n`);

    // Log violations
    if (result.violations.length > 0) {
      core.warning(`Found ${result.violations.length} accessibility violations:`);
      result.violations.forEach((v, i) => {
        core.warning(`${i + 1}. [${v.impact.toUpperCase()}] ${v.description}`);
        core.warning(`   Help: ${v.helpUrl}`);
        core.warning(`   Instances: ${v.nodes.length}`);
      });
    }

    // Check failure conditions
    if (failOnViolations && result.violations.length > 0) {
      core.setFailed(`Found ${result.violations.length} accessibility violations`);
    }

    if (minScore > 0 && result.score < minScore) {
      core.setFailed(`Accessibility score ${result.score} is below minimum required score ${minScore}`);
    }

    if (result.violations.length === 0 && result.score >= minScore) {
      core.info('✓ Accessibility check passed!');
    }
  } catch (error: any) {
    core.setFailed(`Action failed: ${error.message}`);
  }
}

function generateSummary(result: any, url: string, wcagLevel: string): string {
  const grade = getGrade(result.score);
  const gradeEmoji = {
    A: '🟢',
    B: '🟡',
    C: '🟠',
    D: '🔴',
    F: '🔴',
  }[grade];

  let markdown = `# Accessibility Report ${gradeEmoji}\n\n`;
  markdown += `**URL:** ${url}\n`;
  markdown += `**WCAG Level:** ${wcagLevel}\n`;
  markdown += `**Score:** ${result.score}/100 (Grade ${grade})\n\n`;

  markdown += `## Summary\n\n`;
  markdown += `| Metric | Count |\n`;
  markdown += `|--------|-------|\n`;
  markdown += `| ✅ Passes | ${result.passes.length} |\n`;
  markdown += `| ❌ Violations | ${result.violations.length} |\n`;
  markdown += `| ⚠️ Needs Review | ${result.incomplete.length} |\n\n`;

  if (result.violations.length > 0) {
    markdown += `## Violations\n\n`;
    result.violations.slice(0, 10).forEach((v: any, i: number) => {
      const impact = v.impact as 'critical' | 'serious' | 'moderate' | 'minor';
      const impactEmoji = {
        critical: '🔴',
        serious: '🟠',
        moderate: '🟡',
        minor: '🔵',
      }[impact] || '⚪';

      markdown += `### ${i + 1}. ${impactEmoji} ${v.help}\n\n`;
      markdown += `**Impact:** ${v.impact}\n\n`;
      markdown += `**Description:** ${v.description}\n\n`;
      markdown += `**Instances:** ${v.nodes.length}\n\n`;
      markdown += `**Learn more:** ${v.helpUrl}\n\n`;
    });

    if (result.violations.length > 10) {
      markdown += `\n*... and ${result.violations.length - 10} more violations*\n\n`;
    }
  }

  markdown += `\n---\n\n`;
  markdown += `[View full report](https://accessibility-everywhere.org/report?url=${encodeURIComponent(url)})\n`;

  return markdown;
}

async function postPRComment(token: string, result: any, url: string, wcagLevel: string) {
  const octokit = github.getOctokit(token);
  const { context } = github;

  if (!context.payload.pull_request) {
    return;
  }

  const summary = generateSummary(result, url, wcagLevel);

  await octokit.rest.issues.createComment({
    ...context.repo,
    issue_number: context.payload.pull_request.number,
    body: summary,
  });
}

function getGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

run();
