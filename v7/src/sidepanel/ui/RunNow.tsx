import React from 'react'

import { getActiveTabId } from '@/shared/chrome'

export const RunNow = () => {
  const run = async () => {
    const tabId = await getActiveTabId(); if (!tabId) return
    try { await chrome.runtime.sendMessage({ type: 'panel:runNow', tabId }) } catch { /* ignore */ }
  }
  return <button className="border px-2" onClick={run}>Run now</button>
}
