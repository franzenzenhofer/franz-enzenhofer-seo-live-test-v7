# Research Ticket: Hard Refresh Methods for Chrome Extensions

**Date**: 2025-11-14
**Status**: Research
**Priority**: High
**Context**: Need to ensure extension performs hard refresh to collect fresh, uncached data for accurate SEO testing

---

## Problem Statement

The extension currently may be loading cached resources, which can lead to:
- Stale metadata being analyzed
- Outdated canonical tags being checked
- Cached structured data being validated
- Incorrect assessment of live page state

**Goal**: Implement a reliable hard refresh mechanism that bypasses ALL caches and fetches fresh resources.

---

## Research Findings

### 1. Chrome Tabs API - `chrome.tabs.reload()`

**Method**: Use the `bypassCache` parameter

```javascript
// Basic hard reload
chrome.tabs.reload(tabId, { bypassCache: true });

// Get current tab and reload
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.reload(tabs[0].id, { bypassCache: true });
});
```

**Pros**:
- Simple, one-line solution
- Native Chrome API
- No additional permissions required (beyond `tabs`)

**Cons**:
- Only bypasses HTTP cache, NOT:
  - Service Worker cache
  - Application Cache (deprecated but still exists)
  - Memory cache
  - Prefetch cache

**Permissions Required**:
```json
{
  "permissions": ["tabs"]
}
```

---

### 2. Cache-Control Headers via `chrome.webRequest`

**Method**: Intercept requests and force cache bypass headers

```javascript
// Add listener to modify request headers
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    const headers = details.requestHeaders || [];

    // Remove existing cache headers
    const filtered = headers.filter(h =>
      !['if-modified-since', 'if-none-match', 'cache-control'].includes(h.name.toLowerCase())
    );

    // Add cache bypass headers
    filtered.push({ name: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' });
    filtered.push({ name: 'Pragma', value: 'no-cache' });
    filtered.push({ name: 'Expires', value: '0' });

    return { requestHeaders: filtered };
  },
  { urls: ['<all_urls>'] },
  ['blocking', 'requestHeaders', 'extraHeaders']
);
```

**Pros**:
- Forces fresh fetch from origin server
- Works for all resources (HTML, CSS, JS, images)
- Server must respond with fresh content

**Cons**:
- Requires manifest v2's `webRequest` blocking mode OR manifest v3's `declarativeNetRequest`
- More complex setup
- Must handle header modification carefully

**Permissions Required** (Manifest V2):
```json
{
  "permissions": [
    "webRequest",
    "webRequestBlocking",
    "<all_urls>"
  ]
}
```

**Manifest V3 Alternative** (declarativeNetRequest):
```javascript
// Use declarativeNetRequest for header modification
chrome.declarativeNetRequest.updateSessionRules({
  addRules: [{
    id: 1,
    priority: 1,
    action: {
      type: 'modifyHeaders',
      requestHeaders: [
        { header: 'cache-control', operation: 'set', value: 'no-cache' },
        { header: 'pragma', operation: 'set', value: 'no-cache' }
      ]
    },
    condition: {
      urlFilter: '*',
      resourceTypes: ['main_frame', 'sub_frame', 'stylesheet', 'script', 'image']
    }
  }],
  removeRuleIds: [1]
});
```

---

### 3. Service Worker Cache Clearing

**Method**: Clear Service Worker caches before reload

```javascript
// Clear all Service Worker caches
async function clearServiceWorkerCaches(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: async () => {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
      }

      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
    }
  });
}

// Usage
await clearServiceWorkerCaches(tabId);
chrome.tabs.reload(tabId, { bypassCache: true });
```

**Pros**:
- Clears modern PWA caches
- Ensures truly fresh data
- Handles Service Worker interference

**Cons**:
- Requires `scripting` permission
- May affect user experience if site relies on SW
- Async operation, must wait before reload

**Permissions Required**:
```json
{
  "permissions": ["scripting"],
  "host_permissions": ["<all_urls>"]
}
```

---

### 4. Chrome DevTools Protocol (CDP)

**Method**: Use CDP to clear cache programmatically

```javascript
// Attach debugger and clear cache
async function hardRefreshViaCDP(tabId) {
  // Attach debugger
  await chrome.debugger.attach({ tabId }, '1.3');

  // Clear cache
  await chrome.debugger.sendCommand({ tabId }, 'Network.clearBrowserCache');

  // Optional: Clear cookies
  await chrome.debugger.sendCommand({ tabId }, 'Network.clearBrowserCookies');

  // Optional: Disable cache for this session
  await chrome.debugger.sendCommand({ tabId }, 'Network.setCacheDisabled', { cacheDisabled: true });

  // Reload with cache disabled
  await chrome.debugger.sendCommand({ tabId }, 'Page.reload', { ignoreCache: true });

  // Detach debugger
  await chrome.debugger.detach({ tabId });
}
```

**Pros**:
- Most comprehensive cache clearing
- Clears ALL cache types (HTTP, memory, prefetch, etc.)
- Same as DevTools "Empty Cache and Hard Reload"
- Can disable cache entirely for testing

**Cons**:
- Requires debugger permission (scary for users)
- Shows "DevTools is debugging" banner
- More complex API
- Debugger can only attach to one target at a time

**Permissions Required**:
```json
{
  "permissions": ["debugger"]
}
```

---

### 5. Hybrid Approach: Multi-Layer Cache Bypass

**Recommended Method**: Combine multiple approaches for maximum reliability

```javascript
/**
 * Performs a comprehensive hard refresh with multi-layer cache bypass
 * @param {number} tabId - Chrome tab ID
 * @returns {Promise<void>}
 */
async function comprehensiveHardRefresh(tabId) {
  try {
    // Step 1: Clear Service Worker caches
    await chrome.scripting.executeScript({
      target: { tabId },
      func: async () => {
        // Unregister service workers
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map(r => r.unregister()));
        }
        // Clear Cache API
        if ('caches' in window) {
          const names = await caches.keys();
          await Promise.all(names.map(n => caches.delete(n)));
        }
      }
    }).catch(() => {}); // Fail silently if no SW

    // Step 2: Use CDP for thorough cache clearing (if permission available)
    try {
      await chrome.debugger.attach({ tabId }, '1.3');
      await chrome.debugger.sendCommand({ tabId }, 'Network.clearBrowserCache');
      await chrome.debugger.sendCommand({ tabId }, 'Network.setCacheDisabled', { cacheDisabled: true });
      await chrome.debugger.sendCommand({ tabId }, 'Page.reload', { ignoreCache: true });
      await chrome.debugger.detach({ tabId });
    } catch (err) {
      // Fallback to standard reload if debugger not available
      console.warn('CDP not available, using standard bypass:', err);
      await chrome.tabs.reload(tabId, { bypassCache: true });
    }

  } catch (error) {
    console.error('Hard refresh failed:', error);
    // Final fallback
    await chrome.tabs.reload(tabId, { bypassCache: true });
  }
}
```

**Usage**:
```javascript
// In your extension's action handler
chrome.action.onClicked.addListener(async (tab) => {
  await comprehensiveHardRefresh(tab.id);
});

// Or in your existing reload flow
await comprehensiveHardRefresh(currentTabId);
```

---

## Best Practices

### 1. **Progressive Enhancement**
Start with basic `bypassCache: true`, add layers as needed:
```javascript
// Level 1: Basic bypass
chrome.tabs.reload(tabId, { bypassCache: true });

// Level 2: Add Service Worker clearing
// Level 3: Add CDP if critical
```

### 2. **User Communication**
Inform users about hard refresh:
```javascript
// Show badge during refresh
chrome.action.setBadgeText({ text: '⟳', tabId });
chrome.action.setBadgeBackgroundColor({ color: '#4285f4', tabId });

// Clear after reload
chrome.tabs.onUpdated.addListener((updatedTabId, changeInfo) => {
  if (updatedTabId === tabId && changeInfo.status === 'complete') {
    chrome.action.setBadgeText({ text: '', tabId });
  }
});
```

### 3. **Error Handling**
Always provide fallbacks:
```javascript
async function safeHardRefresh(tabId) {
  const methods = [
    () => comprehensiveHardRefresh(tabId),
    () => chrome.tabs.reload(tabId, { bypassCache: true }),
    () => chrome.tabs.reload(tabId) // Last resort
  ];

  for (const method of methods) {
    try {
      await method();
      return; // Success
    } catch (err) {
      console.warn('Method failed, trying next:', err);
    }
  }

  throw new Error('All refresh methods failed');
}
```

### 4. **Performance Considerations**

**Don't**: Clear cache on every page load
```javascript
// BAD: Too aggressive
chrome.tabs.onUpdated.addListener(() => {
  comprehensiveHardRefresh(tabId); // Kills performance!
});
```

**Do**: Clear only when explicitly requested
```javascript
// GOOD: User-initiated or test-specific
document.getElementById('run-test-btn').addEventListener('click', async () => {
  await comprehensiveHardRefresh(tabId);
  runTests(); // Now tests run with fresh data
});
```

### 5. **Cache Verification**

Verify cache bypass is working:
```javascript
// Inject script to check cache status
await chrome.scripting.executeScript({
  target: { tabId },
  func: () => {
    // Check Performance API for cache hits
    const resources = performance.getEntriesByType('resource');
    const cached = resources.filter(r =>
      r.transferSize === 0 || // From cache
      r.deliveryType === 'cache'
    );

    console.log(`Cached resources: ${cached.length}/${resources.length}`);
    return cached.length === 0; // True if nothing cached
  }
});
```

---

## Recommended Implementation for SEO Testing Extension

### Minimal Approach (Good for most cases)
```javascript
// In manifest.json
{
  "permissions": ["tabs", "scripting"],
  "host_permissions": ["<all_urls>"]
}

// In background/service worker
async function runSEOTest(tabId) {
  // Clear Service Worker caches
  await chrome.scripting.executeScript({
    target: { tabId },
    func: async () => {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
    }
  }).catch(() => {});

  // Hard reload
  await chrome.tabs.reload(tabId, { bypassCache: true });

  // Wait for page to load
  await new Promise(resolve => {
    chrome.tabs.onUpdated.addListener(function listener(tid, info) {
      if (tid === tabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    });
  });

  // Now run tests with fresh data
  await runTests(tabId);
}
```

### Maximum Reliability (Use if critical)
Add debugger permission and use CDP method above.

---

## Testing the Implementation

### Test Cases

1. **Test with cached site**:
   - Visit site, close tab
   - Reopen and immediately run test
   - Verify fresh data is fetched (check Network tab)

2. **Test with Service Worker**:
   - Visit PWA with active Service Worker
   - Run hard refresh
   - Verify SW cache is cleared (check Application tab)

3. **Test with aggressive caching**:
   - Visit site with long cache headers (e.g., 1 year)
   - Modify source file
   - Run hard refresh
   - Verify new content appears

4. **Verify Performance API**:
   ```javascript
   // After refresh, check that transferSize > 0 (not from cache)
   performance.getEntriesByType('resource').forEach(r => {
     console.log(r.name, 'transferSize:', r.transferSize);
   });
   ```

---

## Resources & References

### Official Documentation
- [chrome.tabs.reload() API](https://developer.chrome.com/docs/extensions/reference/tabs/#method-reload)
- [chrome.webRequest API](https://developer.chrome.com/docs/extensions/reference/webRequest/)
- [chrome.debugger API](https://developer.chrome.com/docs/extensions/reference/debugger/)
- [Chrome DevTools Protocol - Network Domain](https://chromedevtools.github.io/devtools-protocol/tot/Network/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)

### Cache Types in Chrome
1. **HTTP Cache** (disk cache) - Bypassed by `bypassCache: true`
2. **Memory Cache** - Bypassed by hard reload
3. **Service Worker Cache** - Must clear manually via Cache API
4. **Application Cache** (deprecated) - Clear via CDP
5. **Prefetch Cache** - Clear via CDP
6. **Back/Forward Cache** (bfcache) - Automatic on navigation

### Headers Reference
```http
Cache-Control: no-cache, no-store, must-revalidate, max-age=0
Pragma: no-cache
Expires: 0
```

### Similar Extensions (for reference)
- Lighthouse - Uses CDP for cache clearing
- Web Vitals Extension - Uses standard bypass
- SEO META in 1 CLICK - Uses standard bypass

---

## Conclusion & Recommendation

### For F19N Obtrusive Live Test v7:

**Recommended Approach**: **Hybrid Method (Level 2)**

```javascript
// Implement this in your reload/test flow
async function performHardRefresh(tabId: number): Promise<void> {
  // Clear Service Worker caches (handles PWAs)
  await chrome.scripting.executeScript({
    target: { tabId },
    func: async () => {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(n => caches.delete(n)));
      }
    }
  }).catch(err => console.warn('SW clearing failed:', err));

  // Standard hard reload
  await chrome.tabs.reload(tabId, { bypassCache: true });
}
```

**Why this approach**:
- ✅ No scary debugger permission
- ✅ Handles Service Workers (increasingly common)
- ✅ Bypasses HTTP cache
- ✅ Simple to implement
- ✅ Works for 99% of cases
- ✅ Minimal performance impact
- ✅ Good user experience

**Add CDP method later if**:
- Users report stale data issues
- Need to test high-cache sites
- Willing to request debugger permission

---

## Next Steps

1. ✅ Research complete
2. [ ] Implement `performHardRefresh()` function
3. [ ] Add to existing reload flow in `useReportData.ts` or reload handler
4. [ ] Test with various cache scenarios
5. [ ] Monitor for any stale data reports
6. [ ] Consider CDP upgrade if needed

**Implementation Location**:
- `/v7/src/report/useReportData.ts` (in reload handler)
- Or create new `/v7/src/utils/hardRefresh.ts` utility

---

**Status**: ✅ Research Complete
**Confidence Level**: High
**Ready for Implementation**: Yes
