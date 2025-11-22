// Background service worker for Accessibility Everywhere extension

// Extension installed/updated
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Accessibility Everywhere extension installed');

    // Set default preferences
    chrome.storage.local.set({
      wcagLevel: 'AA',
      autoScan: false,
      showBadge: true,
    });

    // Open welcome page
    chrome.tabs.create({
      url: 'https://accessibility-everywhere.org/welcome',
    });
  } else if (details.reason === 'update') {
    console.log('Accessibility Everywhere extension updated');
  }
});

// Update badge with accessibility score
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateBadge' && sender.tab) {
    updateBadge(sender.tab.id, request.score);
  }
});

function updateBadge(tabId, score) {
  chrome.storage.local.get(['showBadge'], (result) => {
    if (result.showBadge === false) return;

    // Set badge text
    chrome.action.setBadgeText({
      tabId,
      text: score.toString(),
    });

    // Set badge color based on score
    let color;
    if (score >= 90) {
      color = '#28a745'; // Green
    } else if (score >= 70) {
      color = '#8bc34a'; // Light green
    } else if (score >= 50) {
      color = '#ffc107'; // Yellow
    } else {
      color = '#dc3545'; // Red
    }

    chrome.action.setBadgeBackgroundColor({
      tabId,
      color,
    });
  });
}

// Context menu for quick scan
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'scan-page',
    title: 'Scan Page for Accessibility',
    contexts: ['page'],
  });

  chrome.contextMenus.create({
    id: 'scan-element',
    title: 'Check Element Accessibility',
    contexts: ['selection', 'link', 'image'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'scan-page' && tab && tab.id) {
    // Open popup
    chrome.action.openPopup();
  } else if (info.menuItemId === 'scan-element' && tab && tab.id) {
    // Scan specific element
    chrome.tabs.sendMessage(tab.id, {
      action: 'scanElement',
      selector: info.selectionText,
    });
  }
});

// Listen for tab updates to auto-scan if enabled
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.storage.local.get(['autoScan'], (result) => {
      if (result.autoScan && tab.url && !tab.url.startsWith('chrome://')) {
        // Trigger auto-scan
        chrome.tabs.sendMessage(tabId, {
          action: 'scan',
          wcagLevel: 'AA',
        }).catch(() => {
          // Ignore errors (e.g., on chrome:// pages)
        });
      }
    });
  }
});

// Alarm for periodic scans (if enabled)
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'periodic-scan') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'scan',
          wcagLevel: 'AA',
        }).catch(() => {
          // Ignore errors
        });
      }
    });
  }
});

// API endpoint for reporting violations (optional)
const API_ENDPOINT = 'https://api.accessibility-everywhere.org/v1/violations';

async function reportViolation(violation, tabUrl) {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: tabUrl,
        violation,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      }),
    });

    if (!response.ok) {
      console.error('Failed to report violation:', response.statusText);
    }
  } catch (error) {
    console.error('Error reporting violation:', error);
  }
}

console.log('Accessibility Everywhere background service worker loaded');
