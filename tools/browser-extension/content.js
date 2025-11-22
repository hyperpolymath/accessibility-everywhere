// Content script for accessibility scanning
(function() {
  'use strict';

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scan') {
      performScan(request.wcagLevel || 'AA')
        .then(results => sendResponse(results))
        .catch(error => {
          console.error('Scan error:', error);
          sendResponse({ error: error.message });
        });
      return true; // Keep message channel open for async response
    }
  });

  // Perform accessibility scan
  async function performScan(wcagLevel) {
    try {
      // Inject axe-core if not already present
      if (typeof window.axe === 'undefined') {
        await injectAxeCore();
      }

      // Wait for axe to be available
      await waitForAxe();

      // Get WCAG tags based on level
      const wcagTags = getWCAGTags(wcagLevel);

      // Run axe scan
      const results = await window.axe.run({
        runOnly: {
          type: 'tag',
          values: wcagTags,
        },
      });

      // Calculate score
      const score = calculateScore(results);

      // Format results
      return {
        score,
        violations: formatViolations(results.violations),
        passes: formatPasses(results.passes),
        incomplete: formatIncomplete(results.incomplete),
        inapplicable: results.inapplicable.length,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        wcagLevel,
      };
    } catch (error) {
      console.error('Scan failed:', error);
      throw error;
    }
  }

  // Inject axe-core library
  function injectAxeCore() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('axe.min.js');
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load axe-core'));
      document.head.appendChild(script);
    });
  }

  // Wait for axe to be available
  function waitForAxe(timeout = 5000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const check = () => {
        if (typeof window.axe !== 'undefined') {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout waiting for axe-core'));
        } else {
          setTimeout(check, 100);
        }
      };

      check();
    });
  }

  // Get WCAG tags based on level
  function getWCAGTags(level) {
    const tags = ['wcag2a', 'wcag21a', 'wcag22a'];
    if (level === 'AA' || level === 'AAA') {
      tags.push('wcag2aa', 'wcag21aa', 'wcag22aa');
    }
    if (level === 'AAA') {
      tags.push('wcag2aaa', 'wcag21aaa', 'wcag22aaa');
    }
    return tags;
  }

  // Calculate accessibility score
  function calculateScore(results) {
    const totalChecks = results.violations.length + results.passes.length;
    if (totalChecks === 0) return 0;

    const impactWeights = {
      critical: 10,
      serious: 5,
      moderate: 3,
      minor: 1,
    };

    let totalPenalty = 0;
    for (const violation of results.violations) {
      const weight = impactWeights[violation.impact] || 1;
      totalPenalty += weight * violation.nodes.length;
    }

    const maxPossibleScore = totalChecks * 10;
    const score = Math.max(0, Math.round(((maxPossibleScore - totalPenalty) / maxPossibleScore) * 100));

    return score;
  }

  // Format violations
  function formatViolations(violations) {
    return violations.map(v => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      tags: v.tags,
      nodes: v.nodes.map(n => ({
        html: n.html,
        target: n.target,
        failureSummary: n.failureSummary,
      })),
    }));
  }

  // Format passes
  function formatPasses(passes) {
    return passes.map(p => ({
      id: p.id,
      description: p.description,
      help: p.help,
      tags: p.tags,
      nodes: p.nodes.length,
    }));
  }

  // Format incomplete
  function formatIncomplete(incomplete) {
    return incomplete.map(i => ({
      id: i.id,
      impact: i.impact,
      description: i.description,
      help: i.help,
      helpUrl: i.helpUrl,
      tags: i.tags,
      nodes: i.nodes.length,
    }));
  }

  // Auto-scan on page load (optional)
  if (window.location.href.includes('auto-scan=true')) {
    performScan('AA').then(results => {
      console.log('Accessibility scan complete:', results);
    });
  }
})();
