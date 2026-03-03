# Fuzzing for Accessibility Everywhere

This directory contains fuzzing configurations and targets for automated testing of accessibility scanners and parsers.

## Strategy

We use automated fuzzing to ensure that our parsers (DOM, CSS, and ARIA) handle unexpected or malicious input gracefully without crashing.

## Targets

- `fuzz_target_dom.js`: Fuzzes the DOM traversal and ARIA attribute parsing.
- `fuzz_target_css.js`: Fuzzes the CSS accessibility property extractor.

## Running Fuzzers

Fuzzing is integrated into the CI/CD pipeline via specialized jobs. To run locally:

```bash
deno test --allow-all tests/fuzz/
```
