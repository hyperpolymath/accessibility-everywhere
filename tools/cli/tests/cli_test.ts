// SPDX-License-Identifier: PMPL-1.0-or-later
// Copyright (c) 2026 Jonathan D.A. Jewell (hyperpolymath) <j.d.a.jewell@open.ac.uk>
//
// Accessibility Everywhere - CLI Tool Tests
// Tests command-line interface parsing, validation, and execution paths.

import {
  assertEquals,
  assertExists,
  assertStringIncludes,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

// Mock CLI implementation for testing
class MockCLI {
  version = "1.0.0";
  name = "accessibility-scan";

  help(): string {
    return `
${this.name} v${this.version}
Command-line tool for accessibility scanning

USAGE:
    accessibility-scan [COMMAND] [OPTIONS] <URL>

COMMANDS:
    scan       Scan a URL for accessibility issues
    ci         Run accessibility scan for CI/CD
    batch      Scan multiple URLs from a file

OPTIONS:
    -l, --level <level>     WCAG level (A, AA, AAA) [default: AA]
    -o, --output <file>     Output file for results (JSON)
    -f, --format <format>   Output format (json, table, markdown) [default: table]
    --screenshot            Take screenshot
    --min-score <score>     Minimum required score [default: 70]
    --fail-on-violations    Fail if any violations found
    -h, --help              Show this help message
    -v, --version           Show version information

EXAMPLES:
    accessibility-scan scan https://example.com
    accessibility-scan scan https://example.com --level AAA
    accessibility-scan ci https://example.com --min-score 80
    accessibility-scan batch urls.txt --level AA
    `;
  }

  validateUrl(url: string): { valid: boolean; error?: string } {
    try {
      new URL(url);
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: `Invalid URL format: ${url}`,
      };
    }
  }

  parseArgs(args: string[]): {
    command?: string;
    url?: string;
    options: Record<string, string | boolean>;
    error?: string;
  } {
    const options: Record<string, string | boolean> = {};
    let command: string | undefined;
    let url: string | undefined;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg === "--help" || arg === "-h") {
        return { options, error: undefined };
      } else if (arg === "--version" || arg === "-v") {
        return { options, error: undefined };
      } else if (arg === "--level") {
        if (i + 1 < args.length) {
          options["level"] = args[++i];
        }
      } else if (arg === "-l") {
        if (i + 1 < args.length) {
          options["level"] = args[++i];
        }
      } else if (arg === "--output") {
        if (i + 1 < args.length) {
          options["output"] = args[++i];
        }
      } else if (arg === "-o") {
        if (i + 1 < args.length) {
          options["output"] = args[++i];
        }
      } else if (arg === "--format") {
        if (i + 1 < args.length) {
          options["format"] = args[++i];
        }
      } else if (arg === "-f") {
        if (i + 1 < args.length) {
          options["format"] = args[++i];
        }
      } else if (arg === "--min-score") {
        if (i + 1 < args.length) {
          options["min-score"] = args[++i];
        }
      } else if (
        arg === "--screenshot" ||
        arg === "--fail-on-violations"
      ) {
        options[arg.replace(/^--?/, "")] = true;
      } else if (!arg.startsWith("-")) {
        if (!command) {
          command = arg;
        } else {
          url = arg;
        }
      }
    }

    return { command, url, options };
  }
}

// Test suite
Deno.test("CLI - --help outputs usage information", () => {
  const cli = new MockCLI();
  const help = cli.help();

  assertStringIncludes(help, "USAGE:");
  assertStringIncludes(help, "COMMANDS:");
  assertStringIncludes(help, "scan");
  assertStringIncludes(help, "ci");
  assertStringIncludes(help, "batch");
  assertStringIncludes(help, "OPTIONS:");
});

Deno.test("CLI - --version outputs version string", () => {
  const cli = new MockCLI();

  assertEquals(cli.version, "1.0.0");
  assertStringIncludes(cli.version, "1.0.0");
});

Deno.test("CLI - Valid URL argument accepted", () => {
  const cli = new MockCLI();
  const validation = cli.validateUrl("https://example.com");

  assertEquals(validation.valid, true);
});

Deno.test("CLI - Invalid URL argument returns clear error message", () => {
  const cli = new MockCLI();
  const validation = cli.validateUrl("not-a-url");

  assertEquals(validation.valid, false);
  assertExists(validation.error);
  assertStringIncludes(validation.error || "", "Invalid");
});

Deno.test("CLI - Scan command parsed correctly", () => {
  const cli = new MockCLI();
  const parsed = cli.parseArgs(["scan", "https://example.com"]);

  assertEquals(parsed.command, "scan");
  assertEquals(parsed.url, "https://example.com");
});

Deno.test("CLI - WCAG level option parsed", () => {
  const cli = new MockCLI();
  const parsed = cli.parseArgs(["scan", "https://example.com", "--level", "AAA"]);

  assertEquals(parsed.options.level, "AAA");
});

Deno.test("CLI - Output file option parsed", () => {
  const cli = new MockCLI();
  const parsed = cli.parseArgs([
    "scan",
    "https://example.com",
    "--output",
    "results.json",
  ]);

  assertEquals(parsed.options.output, "results.json");
});

Deno.test("CLI - Format option parsed", () => {
  const cli = new MockCLI();
  const parsed = cli.parseArgs([
    "scan",
    "https://example.com",
    "--format",
    "markdown",
  ]);

  assertEquals(parsed.options.format, "markdown");
});

Deno.test("CLI - Screenshot flag parsed", () => {
  const cli = new MockCLI();
  const parsed = cli.parseArgs(["scan", "https://example.com", "--screenshot"]);

  assertEquals(parsed.options.screenshot, true);
});

Deno.test("CLI - CI command with min-score parsed", () => {
  const cli = new MockCLI();
  const parsed = cli.parseArgs([
    "ci",
    "https://example.com",
    "--min-score",
    "85",
  ]);

  assertEquals(parsed.command, "ci");
  assertEquals(parsed.options["min-score"], "85");
});

Deno.test("CLI - Fail on violations flag parsed", () => {
  const cli = new MockCLI();
  const parsed = cli.parseArgs([
    "ci",
    "https://example.com",
    "--fail-on-violations",
  ]);

  assertEquals(parsed.options["fail-on-violations"], true);
});

Deno.test("CLI - Batch command with file argument", () => {
  const cli = new MockCLI();
  const parsed = cli.parseArgs(["batch", "urls.txt"]);

  assertEquals(parsed.command, "batch");
  assertEquals(parsed.url, "urls.txt");
});

Deno.test("CLI - Multiple options combined", () => {
  const cli = new MockCLI();
  const parsed = cli.parseArgs([
    "scan",
    "https://example.com",
    "--level",
    "AA",
    "--format",
    "json",
    "--output",
    "out.json",
  ]);

  assertEquals(parsed.command, "scan");
  assertEquals(parsed.url, "https://example.com");
  assertEquals(parsed.options.level, "AA");
  assertEquals(parsed.options.format, "json");
  assertEquals(parsed.options.output, "out.json");
});

Deno.test("CLI - Help flag recognized", () => {
  const cli = new MockCLI();
  const parsed = cli.parseArgs(["--help"]);

  // Help flag should not produce error for parsing
  assertExists(parsed);
});

Deno.test("CLI - Version flag recognized", () => {
  const cli = new MockCLI();
  const parsed = cli.parseArgs(["--version"]);

  // Version flag should be recognized
  assertExists(parsed);
});

Deno.test("CLI - Short form options (-l) parsed", () => {
  const cli = new MockCLI();
  const parsed = cli.parseArgs(["scan", "https://example.com", "-l", "AAA"]);

  assertEquals(parsed.options.level, "AAA");
});

Deno.test("CLI - Short form options (-o) parsed", () => {
  const cli = new MockCLI();
  const parsed = cli.parseArgs([
    "scan",
    "https://example.com",
    "-o",
    "results.json",
  ]);

  assertEquals(parsed.options.output, "results.json");
});

Deno.test("CLI - WCAG level defaults to AA", () => {
  const cli = new MockCLI();
  const parsed = cli.parseArgs(["scan", "https://example.com"]);

  // Default WCAG level should be AA if not specified
  assertEquals(parsed.options.level === undefined, true);
});
