// DOM elements
const loadingEl = document.getElementById('loading');
const resultsEl = document.getElementById('results');
const errorEl = document.getElementById('error');
const scoreEl = document.getElementById('score');
const violationsCountEl = document.getElementById('violations-count');
const passesCountEl = document.getElementById('passes-count');
const incompleteCountEl = document.getElementById('incomplete-count');
const violationsDetailsEl = document.getElementById('violations-details');
const viewDetailsBtn = document.getElementById('view-details');
const exportReportBtn = document.getElementById('export-report');
const rescanBtn = document.getElementById('rescan');
const retryBtn = document.getElementById('retry');
const wcagSelectEl = document.getElementById('wcag-select');
const errorMessageEl = document.getElementById('error-message');
const scoreCircleEl = document.querySelector('.score-circle');

let currentScanResult = null;

// Initialize popup
async function init() {
  // Load saved WCAG level preference
  const stored = await chrome.storage.local.get(['wcagLevel']);
  if (stored.wcagLevel) {
    wcagSelectEl.value = stored.wcagLevel;
  }

  // Add event listeners
  viewDetailsBtn.addEventListener('click', viewFullReport);
  exportReportBtn.addEventListener('click', exportReport);
  rescanBtn.addEventListener('click', runScan);
  retryBtn.addEventListener('click', runScan);
  wcagSelectEl.addEventListener('change', handleWcagChange);

  // Run initial scan
  runScan();
}

// Run accessibility scan
async function runScan() {
  try {
    showLoading();

    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id) {
      throw new Error('No active tab found');
    }

    // Get WCAG level
    const wcagLevel = wcagSelectEl.value;

    // Execute scan in content script
    const results = await chrome.tabs.sendMessage(tab.id, {
      action: 'scan',
      wcagLevel,
    });

    currentScanResult = results;

    // Store scan result
    await chrome.storage.local.set({
      [`scan_${tab.id}`]: results,
      wcagLevel,
    });

    displayResults(results);
  } catch (error) {
    console.error('Scan failed:', error);
    showError(error.message || 'Failed to scan page. Please try again.');
  }
}

// Display scan results
function displayResults(results) {
  // Update score
  scoreEl.textContent = results.score;
  updateScoreColor(results.score);

  // Update stats
  violationsCountEl.textContent = results.violations.length;
  passesCountEl.textContent = results.passes.length;
  incompleteCountEl.textContent = results.incomplete.length;

  // Display violations
  violationsDetailsEl.innerHTML = '';

  if (results.violations.length === 0) {
    violationsDetailsEl.innerHTML = '<p style="text-align: center; color: #28a745; font-weight: 600;">No violations found! 🎉</p>';
  } else {
    // Group violations by impact
    const grouped = groupByImpact(results.violations);

    ['critical', 'serious', 'moderate', 'minor'].forEach(impact => {
      if (grouped[impact] && grouped[impact].length > 0) {
        grouped[impact].forEach(violation => {
          const violationEl = createViolationElement(violation);
          violationsDetailsEl.appendChild(violationEl);
        });
      }
    });
  }

  // Show results
  hideLoading();
  hideError();
  resultsEl.hidden = false;
}

// Create violation element
function createViolationElement(violation) {
  const div = document.createElement('div');
  div.className = `violation-item ${violation.impact}`;
  div.setAttribute('role', 'listitem');

  const header = document.createElement('div');
  header.className = 'violation-header';

  const title = document.createElement('div');
  title.className = 'violation-title';
  title.textContent = violation.help;

  const impact = document.createElement('span');
  impact.className = `violation-impact ${violation.impact}`;
  impact.textContent = violation.impact;

  header.appendChild(title);
  header.appendChild(impact);

  const description = document.createElement('div');
  description.className = 'violation-description';
  description.textContent = violation.description;

  const count = document.createElement('div');
  count.className = 'violation-count';
  count.textContent = `${violation.nodes.length} instance${violation.nodes.length !== 1 ? 's' : ''}`;

  div.appendChild(header);
  div.appendChild(description);
  div.appendChild(count);

  return div;
}

// Group violations by impact
function groupByImpact(violations) {
  return violations.reduce((acc, violation) => {
    if (!acc[violation.impact]) {
      acc[violation.impact] = [];
    }
    acc[violation.impact].push(violation);
    return acc;
  }, {});
}

// Update score circle color
function updateScoreColor(score) {
  scoreCircleEl.classList.remove('excellent', 'good', 'fair', 'poor');

  if (score >= 90) {
    scoreCircleEl.classList.add('excellent');
  } else if (score >= 70) {
    scoreCircleEl.classList.add('good');
  } else if (score >= 50) {
    scoreCircleEl.classList.add('fair');
  } else {
    scoreCircleEl.classList.add('poor');
  }
}

// View full report
async function viewFullReport() {
  if (!currentScanResult) return;

  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Open dashboard with report
  const reportUrl = `https://accessibility-everywhere.org/report?url=${encodeURIComponent(tab.url)}`;
  chrome.tabs.create({ url: reportUrl });
}

// Export report
async function exportReport() {
  if (!currentScanResult) return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const report = {
    url: tab.url,
    timestamp: new Date().toISOString(),
    score: currentScanResult.score,
    wcagLevel: wcagSelectEl.value,
    violations: currentScanResult.violations,
    passes: currentScanResult.passes,
    incomplete: currentScanResult.incomplete,
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `accessibility-report-${new Date().getTime()}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

// Handle WCAG level change
async function handleWcagChange() {
  await chrome.storage.local.set({ wcagLevel: wcagSelectEl.value });
  runScan();
}

// UI state helpers
function showLoading() {
  loadingEl.hidden = false;
  loadingEl.setAttribute('aria-busy', 'true');
  resultsEl.hidden = true;
  errorEl.hidden = true;
}

function hideLoading() {
  loadingEl.hidden = true;
  loadingEl.setAttribute('aria-busy', 'false');
}

function showError(message) {
  errorMessageEl.textContent = message;
  errorEl.hidden = false;
  loadingEl.hidden = true;
  resultsEl.hidden = true;
}

function hideError() {
  errorEl.hidden = true;
}

// Initialize when popup opens
init();
