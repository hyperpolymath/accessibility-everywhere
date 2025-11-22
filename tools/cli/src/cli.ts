#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import * as fs from 'fs-extra';
import * as path from 'path';
import { createScanner } from '@accessibility-everywhere/scanner';

const program = new Command();

program
  .name('accessibility-scan')
  .description('Command-line tool for accessibility scanning')
  .version('1.0.0');

// Scan command
program
  .command('scan')
  .description('Scan a URL for accessibility issues')
  .argument('<url>', 'URL to scan')
  .option('-l, --level <level>', 'WCAG level (A, AA, AAA)', 'AA')
  .option('-o, --output <file>', 'Output file for results (JSON)')
  .option('-f, --format <format>', 'Output format (json, table, markdown)', 'table')
  .option('--screenshot', 'Take screenshot')
  .action(async (url: string, options: any) => {
    const spinner = ora('Scanning for accessibility issues...').start();

    try {
      const scanner = createScanner();
      const result = await scanner.scan({
        url,
        wcagLevel: options.level,
        screenshot: options.screenshot,
      });

      spinner.succeed('Scan complete!');

      // Display results
      console.log('\n' + '='.repeat(70));
      console.log(chalk.bold.blue('Accessibility Report'));
      console.log('='.repeat(70));
      console.log(`URL: ${url}`);
      console.log(`WCAG Level: ${options.level}`);
      console.log(`Score: ${getScoreColor(result.score)}${result.score}/100${chalk.reset()} (Grade ${getGrade(result.score)})`);
      console.log('='.repeat(70) + '\n');

      // Summary table
      const summaryTable = new Table({
        head: ['Metric', 'Count'],
        colWidths: [30, 10],
      });

      summaryTable.push(
        ['✅ Passes', result.passes.length],
        ['❌ Violations', result.violations.length],
        ['⚠️  Needs Review', result.incomplete.length]
      );

      console.log(summaryTable.toString() + '\n');

      // Violations
      if (result.violations.length > 0) {
        console.log(chalk.bold.red(`Found ${result.violations.length} violations:\n`));

        if (options.format === 'table') {
          const violationsTable = new Table({
            head: ['Impact', 'Description', 'Instances', 'WCAG'],
            colWidths: [12, 50, 10, 15],
          });

          result.violations.forEach((v: any) => {
            violationsTable.push([
              getImpactColor(v.impact) + v.impact + chalk.reset(),
              v.description,
              v.nodes.length,
              v.wcag.join(', '),
            ]);
          });

          console.log(violationsTable.toString());
        } else if (options.format === 'markdown') {
          console.log(generateMarkdown(result, url));
        } else {
          console.log(JSON.stringify(result, null, 2));
        }
      } else {
        console.log(chalk.green.bold('🎉 No violations found! Great job!'));
      }

      // Save to file if requested
      if (options.output) {
        await fs.writeJson(options.output, result, { spaces: 2 });
        console.log(chalk.gray(`\n✓ Results saved to ${options.output}`));
      }

      // Exit with error code if violations found
      process.exit(result.violations.length > 0 ? 1 : 0);
    } catch (error: any) {
      spinner.fail('Scan failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// CI command (for continuous integration)
program
  .command('ci')
  .description('Run accessibility scan for CI/CD')
  .argument('<url>', 'URL to scan')
  .option('-l, --level <level>', 'WCAG level (A, AA, AAA)', 'AA')
  .option('--min-score <score>', 'Minimum required score', '70')
  .option('--fail-on-violations', 'Fail if any violations found')
  .action(async (url: string, options: any) => {
    const spinner = ora('Running CI scan...').start();

    try {
      const scanner = createScanner();
      const result = await scanner.scan({
        url,
        wcagLevel: options.level,
      });

      spinner.succeed('CI scan complete');

      const minScore = parseInt(options.minScore);
      const failOnViolations = options.failOnViolations;

      console.log(`Score: ${result.score}/100`);
      console.log(`Violations: ${result.violations.length}`);

      if (failOnViolations && result.violations.length > 0) {
        console.error(chalk.red(`✗ Failed: Found ${result.violations.length} violations`));
        process.exit(1);
      }

      if (result.score < minScore) {
        console.error(chalk.red(`✗ Failed: Score ${result.score} below minimum ${minScore}`));
        process.exit(1);
      }

      console.log(chalk.green('✓ Passed all checks'));
      process.exit(0);
    } catch (error: any) {
      spinner.fail('CI scan failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Multi-scan command
program
  .command('batch')
  .description('Scan multiple URLs from a file')
  .argument('<file>', 'File containing URLs (one per line)')
  .option('-l, --level <level>', 'WCAG level (A, AA, AAA)', 'AA')
  .option('-o, --output <dir>', 'Output directory for results', './scan-results')
  .action(async (file: string, options: any) => {
    try {
      const urls = (await fs.readFile(file, 'utf-8'))
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));

      console.log(chalk.blue(`Scanning ${urls.length} URLs...`));

      await fs.ensureDir(options.output);

      const scanner = createScanner();
      let completed = 0;
      let failed = 0;

      for (const url of urls) {
        const spinner = ora(`[${completed + 1}/${urls.length}] ${url}`).start();

        try {
          const result = await scanner.scan({
            url,
            wcagLevel: options.level,
          });

          const filename = url.replace(/[^a-z0-9]/gi, '_') + '.json';
          const filepath = path.join(options.output, filename);
          await fs.writeJson(filepath, result, { spaces: 2 });

          spinner.succeed(`${url} - Score: ${result.score}`);
          completed++;
        } catch (error: any) {
          spinner.fail(`${url} - ${error.message}`);
          failed++;
        }
      }

      console.log(chalk.green(`\n✓ Completed: ${completed}`));
      if (failed > 0) {
        console.log(chalk.red(`✗ Failed: ${failed}`));
      }
    } catch (error: any) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Helper functions
function getGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function getScoreColor(score: number): string {
  if (score >= 90) return chalk.green.bold('');
  if (score >= 70) return chalk.yellow.bold('');
  return chalk.red.bold('');
}

function getImpactColor(impact: string): string {
  const colors: Record<string, any> = {
    critical: chalk.red.bold(''),
    serious: chalk.red(''),
    moderate: chalk.yellow(''),
    minor: chalk.blue(''),
  };
  return colors[impact] || '';
}

function generateMarkdown(result: any, url: string): string {
  let md = `# Accessibility Report\n\n`;
  md += `**URL:** ${url}\n`;
  md += `**Score:** ${result.score}/100\n\n`;
  md += `## Violations\n\n`;

  result.violations.forEach((v: any, i: number) => {
    md += `### ${i + 1}. ${v.help}\n\n`;
    md += `- **Impact:** ${v.impact}\n`;
    md += `- **Instances:** ${v.nodes.length}\n`;
    md += `- **Help:** ${v.helpUrl}\n\n`;
  });

  return md;
}

program.parse();
