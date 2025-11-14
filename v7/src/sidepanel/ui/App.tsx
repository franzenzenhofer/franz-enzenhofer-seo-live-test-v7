import { useEffect, useState } from 'react'

import { executeRunNow } from '../utils/runNow'
import { openLogsTab } from '../utils/openLogs'

import { RestrictedBanner } from './RestrictedBanner'
import { Shortcuts } from './Shortcuts'
import { usePageInfo } from './usePageInfo'
import { AppBody } from './AppBody'
import { useResultsSource } from './useResultsSource'
import { useRunMeta } from './useRunMeta'

import { clearLogs } from '@/shared/logs'
import { clearResults } from '@/shared/results'
import { getActiveTabId, injectForTab } from '@/shared/chrome'

export const App = () => {
  const [show, setShow] = useState<Record<string, boolean>>({ ok: true, warn: true, error: true, info: true })
  const [query, setQuery] = useState('')
  const q = usePageInfo()
  const resultsSource = useResultsSource()
  const runMeta = useRunMeta(resultsSource.tabId)
  useEffect(() => {
    getActiveTabId()
      .then(async (id) => { if (id) { try { await injectForTab(id) } catch { /* ignore */ } } })
      .catch(() => {})
  }, [])
  const showRestricted = Boolean(q.isError)
  const displayUrl = q.data?.url || runMeta?.url || ''
  if (q.isLoading && !runMeta && !resultsSource.items.length) return <p className="p-3">Loading…</p>
  const runNow = () => executeRunNow().catch((err) => console.warn('[panel] Run now shortcut failed', err))
  const clean = async () => { const id = await getActiveTabId(); if(id){ await clearResults(id); await clearLogs(id) } }
  const openSettings = () => { const url = chrome.runtime.getURL('src/settings.html'); chrome.tabs.create({ url }) }
  const openReport = async () => {
    const tabId = await getActiveTabId()
    const base = chrome.runtime.getURL('src/report.html')
    const url = tabId ? `${base}?tabId=${tabId}` : base
    chrome.tabs.create({ url })
  }

  return (
    <>
      {showRestricted && (
        <div className="p-3 space-y-1">
          <RestrictedBanner message={String(q.error || 'Content scripts cannot run on this page.')} />
          {runMeta?.url && (
            <p className="text-xs text-amber-700 space-x-1">
              <span>Showing cached results from {runMeta.url}.</span>
              <span>
                Run {runMeta.runId ? `#${runMeta.runId}` : '(unknown)'}
                {runMeta.ranAt ? ` · ${new Date(runMeta.ranAt).toLocaleString()}` : ''}
              </span>
            </p>
          )}
        </div>
      )}
      <Shortcuts runNow={runNow} clean={clean} openLogs={()=> { void openLogsTab() }} openSettings={openSettings} />
      <AppBody
        d={{ url: displayUrl, stale: showRestricted, ranAt: runMeta?.ranAt, runId: runMeta?.runId }}
        show={show}
        setShow={setShow}
        query={query}
        setQuery={setQuery}
        onOpenLogs={()=> { void openLogsTab() }}
        openSettings={openSettings}
        onClean={clean}
        onOpenReport={openReport}
        results={resultsSource.items}
      />
    </>
  )
}
