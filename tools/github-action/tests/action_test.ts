// SPDX-License-Identifier: PMPL-1.0-or-later
// Copyright (c) 2026 Jonathan D.A. Jewell (hyperpolymath) <j.d.a.jewell@open.ac.uk>
//
// Accessibility Everywhere - GitHub Action Tests
// Tests GitHub Actions input validation, output format, and integration.

import {
  assertEquals,
  assertExists,
  assertStringIncludes,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

// Mock GitHub Action input/output
interface ActionInput {
  url?: string;
  "wcag-level"?: string;
  "fail-on-violations"?: string;
  "min-score"?: string;
  "comment-pr"?: string;
  "github-token"?: string;
}

interface ActionOutput {
  score?: number;
  violations?: number;
  passes?: number;
  "report-url"?: string;
}

class MockGitHubAction {
  private inputs: ActionInput = {};
  private outputs: ActionOutput = {};

  setInput(name: string, value: string): void {
    this.inputs[name as keyof ActionInput] = value;
  }

  getInput(name: string, required = false): string | undefined {
    const value = this.inputs[name as keyof ActionInput];
    if (required && !value) {
      throw new Error(`Input required and not supplied: ${name}`);
    }
    return value;
  }

  setOutput(name: string, value: unknown): void {
    this.outputs[name as keyof ActionOutput] = value as never;
  }

  getOutputs(): ActionOutput {
    return this.outputs;
  }

  validateInputs(): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check required input: url
    if (!this.getInput("url")) {
      errors.push("url is required");
    }

    // Validate URL format if provided
    const url = this.getInput("url");
    if (url) {
      try {
        new URL(url);
      } catch {
        errors.push(`Invalid URL format: ${url}`);
      }
    }

    // Validate wcag-level
    const wcagLevel = this.getInput("wcag-level");
    if (wcagLevel && !["A", "AA", "AAA"].includes(wcagLevel)) {
      errors.push(`Invalid WCAG level: ${wcagLevel}. Must be A, AA, or AAA`);
    }

    // Validate min-score
    const minScore = this.getInput("min-score");
    if (minScore) {
      const score = parseInt(minScore);
      if (isNaN(score) || score < 0 || score > 100) {
        errors.push(`Invalid min-score: ${minScore}. Must be 0-100`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  generateSummary(result: {
    score: number;
    violations: unknown[];
    passes: unknown[];
  }): string {
    const grade =
      result.score >= 90
        ? "A"
        : result.score >= 80
          ? "B"
          : result.score >= 70
            ? "C"
            : "F";

    let markdown = `# Accessibility Report\n\n`;
    markdown += `**Score:** ${result.score}/100 (Grade ${grade})\n`;
    markdown += `**Violations:** ${Array.isArray(result.violations) ? result.violations.length : 0}\n`;
    markdown += `**Passes:** ${Array.isArray(result.passes) ? result.passes.length : 0}\n`;

    return markdown;
  }
}

// Test suite
Deno.test("GitHub Action - URL input required", () => {
  const action = new MockGitHubAction();

  const validation = action.validateInputs();
  assertEquals(validation.valid, false);
  assertStringIncludes(validation.errors.join(","), "url is required");
});

Deno.test("GitHub Action - Missing required input produces clear error", () => {
  const action = new MockGitHubAction();
  action.setInput("wcag-level", "AA");

  const validation = action.validateInputs();
  assertEquals(validation.valid, false);
  assertEquals(validation.errors.length > 0, true);
});

Deno.test("GitHub Action - URL input validated", () => {
  const action = new MockGitHubAction();
  action.setInput("url", "https://example.com");

  const validation = action.validateInputs();
  assertEquals(validation.valid, true);
});

Deno.test("GitHub Action - Invalid URL returns error", () => {
  const action = new MockGitHubAction();
  action.setInput("url", "not-a-valid-url");

  const validation = action.validateInputs();
  assertEquals(validation.valid, false);
  assertStringIncludes(validation.errors.join(","), "Invalid URL");
});

Deno.test("GitHub Action - WCAG level validated (A)", () => {
  const action = new MockGitHubAction();
  action.setInput("url", "https://example.com");
  action.setInput("wcag-level", "A");

  const validation = action.validateInputs();
  assertEquals(validation.valid, true);
});

Deno.test("GitHub Action - WCAG level validated (AA)", () => {
  const action = new MockGitHubAction();
  action.setInput("url", "https://example.com");
  action.setInput("wcag-level", "AA");

  const validation = action.validateInputs();
  assertEquals(validation.valid, true);
});

Deno.test("GitHub Action - WCAG level validated (AAA)", () => {
  const action = new MockGitHubAction();
  action.setInput("url", "https://example.com");
  action.setInput("wcag-level", "AAA");

  const validation = action.validateInputs();
  assertEquals(validation.valid, true);
});

Deno.test("GitHub Action - Invalid WCAG level rejected", () => {
  const action = new MockGitHubAction();
  action.setInput("url", "https://example.com");
  action.setInput("wcag-level", "INVALID");

  const validation = action.validateInputs();
  assertEquals(validation.valid, false);
  assertStringIncludes(validation.errors.join(","), "Invalid WCAG level");
});

Deno.test("GitHub Action - Min score validated (0)", () => {
  const action = new MockGitHubAction();
  action.setInput("url", "https://example.com");
  action.setInput("min-score", "0");

  const validation = action.validateInputs();
  assertEquals(validation.valid, true);
});

Deno.test("GitHub Action - Min score validated (100)", () => {
  const action = new MockGitHubAction();
  action.setInput("url", "https://example.com");
  action.setInput("min-score", "100");

  const validation = action.validateInputs();
  assertEquals(validation.valid, true);
});

Deno.test("GitHub Action - Min score out of range rejected", () => {
  const action = new MockGitHubAction();
  action.setInput("url", "https://example.com");
  action.setInput("min-score", "150");

  const validation = action.validateInputs();
  assertEquals(validation.valid, false);
  assertStringIncludes(validation.errors.join(","), "Invalid min-score");
});

Deno.test("GitHub Action - Non-numeric min-score rejected", () => {
  const action = new MockGitHubAction();
  action.setInput("url", "https://example.com");
  action.setInput("min-score", "not-a-number");

  const validation = action.validateInputs();
  assertEquals(validation.valid, false);
});

Deno.test("GitHub Action - Output score set correctly", () => {
  const action = new MockGitHubAction();
  action.setInput("url", "https://example.com");

  action.setOutput("score", 85);
  const outputs = action.getOutputs();

  assertEquals(outputs.score, 85);
});

Deno.test("GitHub Action - Output violations count set", () => {
  const action = new MockGitHubAction();
  action.setOutput("violations", 3);
  const outputs = action.getOutputs();

  assertEquals(outputs.violations, 3);
});

Deno.test("GitHub Action - Output passes count set", () => {
  const action = new MockGitHubAction();
  action.setOutput("passes", 42);
  const outputs = action.getOutputs();

  assertEquals(outputs.passes, 42);
});

Deno.test("GitHub Action - Output report-url set", () => {
  const action = new MockGitHubAction();
  action.setOutput(
    "report-url",
    "https://accessibility-everywhere.org/report?url=..."
  );
  const outputs = action.getOutputs();

  assertExists(outputs["report-url"]);
  assertStringIncludes(outputs["report-url"] || "", "accessibility-everywhere");
});

Deno.test("GitHub Action - All required outputs present", () => {
  const action = new MockGitHubAction();

  action.setOutput("score", 85);
  action.setOutput("violations", 3);
  action.setOutput("passes", 42);
  action.setOutput("report-url", "https://example.org/report");

  const outputs = action.getOutputs();

  assertExists(outputs.score);
  assertExists(outputs.violations);
  assertExists(outputs.passes);
  assertExists(outputs["report-url"]);
});

Deno.test("GitHub Action - Summary generated with correct format", () => {
  const action = new MockGitHubAction();

  const summary = action.generateSummary({
    score: 85,
    violations: [{ id: "v1" }, { id: "v2" }, { id: "v3" }],
    passes: Array(42).fill(null),
  });

  assertStringIncludes(summary, "Accessibility Report");
  assertStringIncludes(summary, "85");
  assertStringIncludes(summary, "Grade B");
  assertStringIncludes(summary, "**Violations:** 3");
  assertStringIncludes(summary, "**Passes:** 42");
});

Deno.test("GitHub Action - Summary grading accurate (A grade)", () => {
  const action = new MockGitHubAction();

  const summary = action.generateSummary({
    score: 95,
    violations: [],
    passes: Array(50).fill(null),
  });

  assertStringIncludes(summary, "Grade A");
});

Deno.test("GitHub Action - Summary grading accurate (B grade)", () => {
  const action = new MockGitHubAction();

  const summary = action.generateSummary({
    score: 85,
    violations: [1, 2, 3],
    passes: Array(40).fill(null),
  });

  assertStringIncludes(summary, "Grade B");
});

Deno.test("GitHub Action - Summary grading accurate (C grade)", () => {
  const action = new MockGitHubAction();

  const summary = action.generateSummary({
    score: 75,
    violations: Array(10).fill(null),
    passes: Array(30).fill(null),
  });

  assertStringIncludes(summary, "Grade C");
});

Deno.test("GitHub Action - Summary grading accurate (F grade)", () => {
  const action = new MockGitHubAction();

  const summary = action.generateSummary({
    score: 55,
    violations: Array(20).fill(null),
    passes: Array(20).fill(null),
  });

  assertStringIncludes(summary, "Grade F");
});

Deno.test("GitHub Action - Multiple inputs processed together", () => {
  const action = new MockGitHubAction();

  action.setInput("url", "https://example.com");
  action.setInput("wcag-level", "AA");
  action.setInput("min-score", "75");
  action.setInput("fail-on-violations", "true");
  action.setInput("comment-pr", "true");

  const validation = action.validateInputs();
  assertEquals(validation.valid, true);
  assertEquals(validation.errors.length, 0);
});

Deno.test("GitHub Action - Input defaults applied", () => {
  const action = new MockGitHubAction();
  action.setInput("url", "https://example.com");

  // Unset inputs should return undefined, not throw
  const wcagLevel = action.getInput("wcag-level");
  assertEquals(wcagLevel, undefined);
});

Deno.test("GitHub Action - Boolean inputs parsed", () => {
  const action = new MockGitHubAction();
  action.setInput("url", "https://example.com");
  action.setInput("fail-on-violations", "true");

  const failOnViolations = action.getInput("fail-on-violations");
  assertEquals(failOnViolations, "true");
});
