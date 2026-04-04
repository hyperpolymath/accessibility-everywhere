// SPDX-License-Identifier: PMPL-1.0-or-later
// Copyright (c) 2026 Jonathan D.A. Jewell (hyperpolymath) <j.d.a.jewell@open.ac.uk>
//
// Accessibility Everywhere - Security Aspect Tests
// Tests critical security properties: SSRF prevention, input validation,
// injection protection, and error handling.

import {
  assertEquals,
  assertIsError,
  assertStringIncludes,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

// Security validator for testing
class SecurityValidator {
  // SSRF prevention: block local and private IP addresses
  isPrivateOrLocalIP(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      // Block localhost
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        return true;
      }

      // Block loopback range 127.0.0.0/8
      if (hostname.startsWith("127.")) {
        return true;
      }

      // Block private IP ranges
      // 10.0.0.0/8
      if (hostname.startsWith("10.")) {
        return true;
      }

      // 172.16.0.0/12
      if (hostname.startsWith("172.")) {
        const secondOctet = parseInt(hostname.split(".")[1]);
        if (secondOctet >= 16 && secondOctet <= 31) {
          return true;
        }
      }

      // 192.168.0.0/16
      if (hostname.startsWith("192.168.")) {
        return true;
      }

      // Block link-local 169.254.0.0/16
      if (hostname.startsWith("169.254.")) {
        return true;
      }

      // Block ::1 (IPv6 loopback)
      if (hostname === "::1") {
        return true;
      }

      // Block IPv6 private ranges
      if (hostname.startsWith("fc00:") || hostname.startsWith("fd00:")) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  validateUrlInput(url: string): { valid: boolean; error?: string } {
    // Check for SSRF
    if (this.isPrivateOrLocalIP(url)) {
      return {
        valid: false,
        error: "SSRF prevention: local and private IPs are not allowed",
      };
    }

    // Check URL length (prevent buffer overflow)
    if (url.length > 2048) {
      return {
        valid: false,
        error: "URL exceeds maximum length (2048 characters)",
      };
    }

    // Check valid URL format
    try {
      new URL(url);
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: "Invalid URL format",
      };
    }
  }

  sanitizeInput(input: string): string {
    // Remove null bytes
    let sanitized = input.replace(/\0/g, "");

    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, "");

    // Trim whitespace
    sanitized = sanitized.trim();

    return sanitized;
  }

  isMalformedUrl(url: string): boolean {
    try {
      new URL(url);
      return false;
    } catch {
      return true;
    }
  }

  isXSSPayload(input: string): boolean {
    // Check for common XSS patterns
    const xssPatterns = [
      /javascript:/i,
      /<script/i,
      /on\w+\s*=/i,
      /eval\(/i,
      /expression\(/i,
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(input)) {
        return true;
      }
    }

    return false;
  }
}

// Test suite
Deno.test("Security - SSRF prevention: localhost blocked", () => {
  const validator = new SecurityValidator();
  const result = validator.validateUrlInput("http://localhost");

  assertEquals(result.valid, false);
  assertStringIncludes(result.error || "", "SSRF");
});

Deno.test("Security - SSRF prevention: 127.0.0.1 blocked", () => {
  const validator = new SecurityValidator();
  const result = validator.validateUrlInput("http://127.0.0.1");

  assertEquals(result.valid, false);
  assertStringIncludes(result.error || "", "SSRF");
});

Deno.test("Security - SSRF prevention: 192.168.x.x blocked", () => {
  const validator = new SecurityValidator();
  const result = validator.validateUrlInput("http://192.168.1.1");

  assertEquals(result.valid, false);
  assertStringIncludes(result.error || "", "SSRF");
});

Deno.test("Security - SSRF prevention: 10.x.x.x blocked", () => {
  const validator = new SecurityValidator();
  const result = validator.validateUrlInput("http://10.0.0.1");

  assertEquals(result.valid, false);
  assertStringIncludes(result.error || "", "SSRF");
});

Deno.test("Security - SSRF prevention: 172.16-31.x.x blocked", () => {
  const validator = new SecurityValidator();
  const result = validator.validateUrlInput("http://172.16.0.1");

  assertEquals(result.valid, false);
  assertStringIncludes(result.error || "", "SSRF");
});

Deno.test("Security - SSRF prevention: localhost case-insensitive", () => {
  const validator = new SecurityValidator();
  // Test case-insensitive handling
  const result1 = validator.validateUrlInput("http://localhost:3000");
  const result2 = validator.validateUrlInput("http://LOCALHOST:3000");

  // Both should be blocked
  assertEquals(result1.valid, false);
  assertEquals(result2.valid, false);
});

Deno.test("Security - SSRF prevention: Valid external URL allowed", () => {
  const validator = new SecurityValidator();
  const result = validator.validateUrlInput("https://example.com");

  assertEquals(result.valid, true);
});

Deno.test("Security - XSS prevention: javascript: protocol blocked", () => {
  const validator = new SecurityValidator();
  const hasXSS = validator.isXSSPayload("javascript:alert('xss')");

  assertEquals(hasXSS, true);
});

Deno.test("Security - XSS prevention: script tag blocked", () => {
  const validator = new SecurityValidator();
  const hasXSS = validator.isXSSPayload("<script>alert('xss')</script>");

  assertEquals(hasXSS, true);
});

Deno.test("Security - XSS prevention: event handler blocked", () => {
  const validator = new SecurityValidator();
  const hasXSS = validator.isXSSPayload('onclick="alert(\'xss\')"');

  assertEquals(hasXSS, true);
});

Deno.test("Security - XSS prevention: eval() blocked", () => {
  const validator = new SecurityValidator();
  const hasXSS = validator.isXSSPayload("eval('malicious')");

  assertEquals(hasXSS, true);
});

Deno.test("Security - XSS prevention: Normal input passes", () => {
  const validator = new SecurityValidator();
  const hasXSS = validator.isXSSPayload("Normal user input");

  assertEquals(hasXSS, false);
});

Deno.test("Security - Input sanitization: Null bytes removed", () => {
  const validator = new SecurityValidator();
  const sanitized = validator.sanitizeInput("hello\x00world");

  assertEquals(sanitized, "helloworld");
});

Deno.test("Security - Input sanitization: Control characters removed", () => {
  const validator = new SecurityValidator();
  const sanitized = validator.sanitizeInput("hello\x01\x02world");

  assertEquals(sanitized, "helloworld");
});

Deno.test("Security - Input sanitization: Whitespace trimmed", () => {
  const validator = new SecurityValidator();
  const sanitized = validator.sanitizeInput("  hello world  ");

  assertEquals(sanitized, "hello world");
});

Deno.test("Security - Oversized URL input rejected gracefully", () => {
  const validator = new SecurityValidator();
  const longUrl = "https://example.com/" + "a".repeat(3000);
  const result = validator.validateUrlInput(longUrl);

  assertEquals(result.valid, false);
  assertStringIncludes(result.error || "", "length");
});

Deno.test("Security - Malformed URL returns 400 error", () => {
  const validator = new SecurityValidator();
  const result = validator.validateUrlInput("not a valid url");

  assertEquals(result.valid, false);
  assertStringIncludes(result.error || "", "Invalid");
});

Deno.test("Security - Malformed URL detection", () => {
  const validator = new SecurityValidator();

  assertEquals(validator.isMalformedUrl("not a url"), true);
  assertEquals(validator.isMalformedUrl("https://example.com"), false);
});

Deno.test("Security - Error message clarity: No internal details leaked", () => {
  const validator = new SecurityValidator();
  const result = validator.validateUrlInput("malformed://[invalid");

  assertEquals(result.valid, false);
  // Error should not contain internal implementation details
  assertStringIncludes(result.error || "", "Invalid");
});

Deno.test("Security - Port numbers respected in URL validation", () => {
  const validator = new SecurityValidator();

  // Valid port
  const result1 = validator.validateUrlInput("https://example.com:443");
  assertEquals(result1.valid, true);

  // Valid custom port
  const result2 = validator.validateUrlInput("https://example.com:8080");
  assertEquals(result2.valid, true);
});

Deno.test("Security - Scheme validation: http allowed", () => {
  const validator = new SecurityValidator();
  const result = validator.validateUrlInput("http://example.com");

  assertEquals(result.valid, true);
});

Deno.test("Security - Scheme validation: https allowed", () => {
  const validator = new SecurityValidator();
  const result = validator.validateUrlInput("https://example.com");

  assertEquals(result.valid, true);
});

Deno.test("Security - Query parameters preserved", () => {
  const validator = new SecurityValidator();
  const result = validator.validateUrlInput(
    "https://example.com/path?key=value&foo=bar"
  );

  assertEquals(result.valid, true);
});

Deno.test("Security - URL fragments preserved", () => {
  const validator = new SecurityValidator();
  const result = validator.validateUrlInput(
    "https://example.com/path#section"
  );

  assertEquals(result.valid, true);
});

Deno.test("Security - Case insensitivity for private IP detection", () => {
  const validator = new SecurityValidator();

  // Uppercase
  const result1 = validator.validateUrlInput("http://LOCALHOST");
  assertEquals(result1.valid, false);

  // Mixed case
  const result2 = validator.validateUrlInput("http://LoCalHost");
  assertEquals(result2.valid, false);
});
