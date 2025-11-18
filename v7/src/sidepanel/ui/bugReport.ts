import { getActiveTabId } from '@/shared/chrome'
import { getLogs } from '@/shared/logs'
import { readResults } from '@/shared/results'

export const buildBugReport = async (): Promise<string> => {
  const tabId = await getActiveTabId()
  const manifest = chrome.runtime.getManifest()
  const ua = navigator.userAgent
  const tab = tabId ? (await chrome.tabs.get(tabId).catch(() => null) as chrome.tabs.Tab | null) : null
  const k = tabId ? `debug:last-run:${tabId}` : ''
  const lastRun = tabId ? (await chrome.storage.session.get(k))[k as string] : null
  const logs = tabId ? await getLogs(tabId) : []
  const results = tabId ? await readResults(tabId) : []
  const settings = await chrome.storage.local.get(['ui:autoRun','ui:autoClear','ui:debug','rule-flags','globalRuleVariables'])
  const report = {
    meta: { time: new Date().toISOString(), ua, manifest: { name: manifest.name, version: manifest.version, version_name: (manifest as unknown as { version_name?: string }).version_name || '' } },
    tab: { id: tabId, url: tab?.url || null, title: tab?.title || null },
    settings,
    lastRun,
    counts: { logs: logs.length, results: results.length },
    tailLogs: logs.slice(-50),
    resultsSample: results.slice(0, 50),
  }
  return JSON.stringify(report, null, 2)
}
