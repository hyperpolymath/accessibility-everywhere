// Accessibility Everywhere Testing Dashboard
const API_BASE = 'https://api.accessibility-everywhere.org/v1';
const LOCAL_API = 'http://localhost:3000/v1';

// Use local API in development
const API_URL = window.location.hostname === 'localhost' ? LOCAL_API : API_BASE;

// DOM Elements
const scanForm = document.getElementById('scan-form');
const urlInput = document.getElementById('url-input');
const wcagSelect = document.getElementById('wcag-level');
const loadingSection = document.getElementById('loading-section');
const resultsSection = document.getElementById('results-section');
const scanningUrl = document.getElementById('scanning-url');
const progressFill = document.getElementById('progress-fill');

// Results elements
const reportUrl = document.getElementById('report-url');
const reportDate = document.getElementById('report-date');
const scoreValue = document.getElementById('score-value');
const scoreGrade = document.getElementById('score-grade');
const scoreProgress = document.getElementById('score-progress');
const violationsCount = document.getElementById('violations-count');
const passesCount = document.getElementById('passes-count');
const incompleteCount = document.getElementById('incomplete-count');
const violationsList = document.getElementById('violations-list');

// Action buttons
const downloadReportBtn = document.getElementById('download-report');
const shareReportBtn = document.getElementById('share-report');
const newScanBtn = document.getElementById('new-scan');

// Leaderboard
const leaderboardBody = document.getElementById('leaderboard-body');

// State
let currentScanResult = null;
let currentUrl = '';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  scanForm.addEventListener('submit', handleScan);
  downloadReportBtn.addEventListener('click', downloadReport);
  shareReportBtn.addEventListener('click', shareReport);
  newScanBtn.addEventListener('click', resetScan);

  // Filter buttons
  document.querySelectorAll('.violations-filter .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => filterViolations(btn.dataset.filter));
  });

  document.querySelectorAll('.leaderboard-filters .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => filterLeaderboard(btn.dataset.category));
  });

  // Load leaderboard
  loadLeaderboard();

  // Check for URL parameter
  const params = new URLSearchParams(window.location.search);
  const urlParam = params.get('url');
  if (urlParam) {
    urlInput.value = urlParam;
    handleScan(new Event('submit'));
  }
});

// Handle scan submission
async function handleScan(e) {
  e.preventDefault();

  const url = urlInput.value.trim();
  if (!url) return;

  currentUrl = url;

  try {
    // Validate URL
    new URL(url);

    showLoading(url);

    // Call API
    const response = await fetch(`${API_URL}/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        wcagLevel: wcagSelect.value,
      }),
    });

    if (!response.ok) {
      throw new Error('Scan failed');
    }

    const result = await response.json();
    currentScanResult = result;

    displayResults(result);
  } catch (error) {
    console.error('Scan error:', error);
    alert('Failed to scan website. Please check the URL and try again.');
    resetScan();
  }
}

// Show loading state
function showLoading(url) {
  scanningUrl.textContent = url;
  loadingSection.hidden = false;
  resultsSection.hidden = true;
  loadingSection.setAttribute('aria-busy', 'true');

  // Animate progress bar
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress > 90) progress = 90;
    progressFill.style.width = progress + '%';
  }, 300);

  // Store interval ID to clear later
  loadingSection.dataset.intervalId = interval;

  // Scroll to loading section
  loadingSection.scrollIntoView({ behavior: 'smooth' });
}

// Display results
function displayResults(result) {
  // Clear loading interval
  const intervalId = loadingSection.dataset.intervalId;
  if (intervalId) clearInterval(parseInt(intervalId));

  progressFill.style.width = '100%';

  // Hide loading, show results
  setTimeout(() => {
    loadingSection.hidden = true;
    loadingSection.setAttribute('aria-busy', 'false');
    resultsSection.hidden = false;

    // Update report metadata
    reportUrl.textContent = result.url;
    reportDate.textContent = new Date(result.timestamp).toLocaleString();

    // Update score
    updateScore(result.score);

    // Update stats
    violationsCount.textContent = result.violations.length;
    passesCount.textContent = result.passes.length;
    incompleteCount.textContent = result.incomplete.length;

    // Display violations
    displayViolations(result.violations);

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
  }, 500);
}

// Update score display
function updateScore(score) {
  scoreValue.textContent = score;

  // Calculate grade
  const grade = getGrade(score);
  scoreGrade.textContent = grade;

  // Update circle progress
  const circumference = 565.48;
  const offset = circumference - (score / 100) * circumference;
  scoreProgress.style.strokeDashoffset = offset;

  // Update color based on grade
  const colors = {
    A: '#28a745',
    B: '#8bc34a',
    C: '#ffc107',
    D: '#ff9800',
    F: '#dc3545',
  };
  scoreProgress.style.stroke = colors[grade] || colors.F;
}

// Get grade from score
function getGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

// Display violations
function displayViolations(violations) {
  violationsList.innerHTML = '';

  if (violations.length === 0) {
    violationsList.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: #28a745; font-weight: 700; font-size: 1.25rem;">
        <span style="font-size: 3rem;">🎉</span>
        <p>No violations found! This page passed all accessibility checks.</p>
      </div>
    `;
    return;
  }

  // Sort by impact
  const impactOrder = { critical: 0, serious: 1, moderate: 2, minor: 3 };
  violations.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);

  violations.forEach(violation => {
    const card = createViolationCard(violation);
    violationsList.appendChild(card);
  });
}

// Create violation card
function createViolationCard(violation) {
  const card = document.createElement('div');
  card.className = `violation-card ${violation.impact}`;
  card.dataset.impact = violation.impact;
  card.setAttribute('role', 'listitem');

  card.innerHTML = `
    <div class="violation-header">
      <div class="violation-title">${escapeHtml(violation.help)}</div>
      <span class="violation-badge ${violation.impact}">${violation.impact}</span>
    </div>
    <div class="violation-description">${escapeHtml(violation.description)}</div>
    <div class="violation-instances">
      ${violation.nodes.length} instance${violation.nodes.length !== 1 ? 's' : ''} found
      ${violation.wcag.length > 0 ? `• WCAG: ${violation.wcag.join(', ')}` : ''}
    </div>
    <details style="margin-top: 1rem;">
      <summary style="cursor: pointer; font-weight: 600; color: var(--primary);">View Details & How to Fix</summary>
      <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-alt); border-radius: 8px;">
        <p style="margin-bottom: 0.5rem;"><strong>Learn more:</strong> <a href="${violation.helpUrl}" target="_blank" rel="noopener">${violation.helpUrl}</a></p>
        <p style="margin-bottom: 0.5rem;"><strong>Affected elements:</strong></p>
        <ul style="list-style: disc; padding-left: 1.5rem; font-family: monospace; font-size: 0.875rem;">
          ${violation.nodes.slice(0, 5).map(node => `<li>${escapeHtml(node.target.join(' '))}</li>`).join('')}
          ${violation.nodes.length > 5 ? `<li>... and ${violation.nodes.length - 5} more</li>` : ''}
        </ul>
      </div>
    </details>
  `;

  return card;
}

// Filter violations
function filterViolations(impact) {
  // Update active button
  document.querySelectorAll('.violations-filter .filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === impact);
  });

  // Filter cards
  document.querySelectorAll('.violation-card').forEach(card => {
    if (impact === 'all' || card.dataset.impact === impact) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

// Download report
function downloadReport() {
  if (!currentScanResult) return;

  const report = {
    ...currentScanResult,
    scannedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `accessibility-report-${new Date().getTime()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Share report
function shareReport() {
  if (!currentUrl) return;

  const shareUrl = `${window.location.origin}${window.location.pathname}?url=${encodeURIComponent(currentUrl)}`;

  if (navigator.share) {
    navigator.share({
      title: 'Accessibility Report',
      text: `Check out the accessibility report for ${currentUrl}`,
      url: shareUrl,
    });
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Share URL copied to clipboard!');
    });
  }
}

// Reset scan
function resetScan() {
  loadingSection.hidden = true;
  resultsSection.hidden = true;
  urlInput.value = '';
  currentScanResult = null;
  currentUrl = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Load leaderboard
async function loadLeaderboard() {
  try {
    const response = await fetch(`${API_URL}/leaderboard?limit=100`);
    if (!response.ok) {
      throw new Error('Failed to load leaderboard');
    }

    const data = await response.json();
    displayLeaderboard(data.sites || []);
  } catch (error) {
    console.error('Leaderboard error:', error);
    // Show mock data if API fails
    displayLeaderboard(getMockLeaderboard());
  }
}

// Display leaderboard
function displayLeaderboard(sites) {
  leaderboardBody.innerHTML = '';

  sites.forEach((site, index) => {
    const row = document.createElement('tr');
    const grade = getGrade(site.score);

    row.innerHTML = `
      <td>${index + 1}</td>
      <td><a href="?url=${encodeURIComponent(site.url)}" style="color: var(--primary); text-decoration: none;">${escapeHtml(site.domain)}</a></td>
      <td><strong>${site.score}</strong></td>
      <td><span class="grade-badge ${grade}">${grade}</span></td>
      <td>${site.violations}</td>
      <td>${new Date(site.lastScanned).toLocaleDateString()}</td>
    `;

    leaderboardBody.appendChild(row);
  });
}

// Filter leaderboard
function filterLeaderboard(category) {
  document.querySelectorAll('.leaderboard-filters .filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === category);
  });

  // In production, this would filter the leaderboard
  // For now, just reload
  loadLeaderboard();
}

// Get mock leaderboard data
function getMockLeaderboard() {
  const domains = [
    { domain: 'github.com', score: 94, violations: 3, category: 'tech' },
    { domain: 'stackoverflow.com', score: 91, violations: 5, category: 'tech' },
    { domain: 'wikipedia.org', score: 89, violations: 7, category: 'education' },
    { domain: 'bbc.com', score: 87, violations: 8, category: 'news' },
    { domain: 'gov.uk', score: 95, violations: 2, category: 'government' },
    { domain: 'amazon.com', score: 72, violations: 45, category: 'ecommerce' },
    { domain: 'etsy.com', score: 78, violations: 32, category: 'ecommerce' },
    { domain: 'nytimes.com', score: 85, violations: 12, category: 'news' },
    { domain: 'mit.edu', score: 88, violations: 9, category: 'education' },
    { domain: 'shopify.com', score: 81, violations: 24, category: 'ecommerce' },
  ];

  return domains.map(d => ({
    ...d,
    url: `https://${d.domain}`,
    lastScanned: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
  }));
}

// Utility: Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Announce to screen readers
function announce(message) {
  const announcer = document.createElement('div');
  announcer.setAttribute('role', 'status');
  announcer.setAttribute('aria-live', 'polite');
  announcer.className = 'sr-only';
  announcer.textContent = message;
  document.body.appendChild(announcer);
  setTimeout(() => announcer.remove(), 1000);
}

console.log('Accessibility Everywhere Dashboard loaded');
