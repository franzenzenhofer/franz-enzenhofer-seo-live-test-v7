/**
 * Logs Component - Main logs view
 */

import { useEffect, useState, useMemo } from 'react'

import { buildBugReport } from './bugReport'
import { LogsHeader } from './LogsHeader'
import { LogsFilters, type LogCategory } from './LogsFilters'
import { LogsList } from './LogsList'
import { extractCategory } from './logs-utils'

import { getActiveTabId } from '@/shared/chrome'
import { clearLogs, getLogs } from '@/shared/logs'

export const Logs = () => {
  const [tabId, setTabId] = useState<number | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [filterCategory, setFilterCategory] = useState<LogCategory>('all')
  const [searchText, setSearchText] = useState('')
  const [selectedLogs, setSelectedLogs] = useState<Set<number>>(new Set())
  const [copiedLog, setCopiedLog] = useState<number | null>(null)

  useEffect(() => { getActiveTabId().then(setTabId).catch(() => {}) }, [])

  useEffect(() => {
    if (!tabId) return
    const load = () => getLogs(tabId).then(setLogs)
    load()
    const onChange = (c: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area !== 'session') return
      if (Object.keys(c).some((k) => k === `logs:${tabId}`)) load()
    }
    chrome.storage.onChanged.addListener(onChange)
    return () => chrome.storage.onChanged.removeListener(onChange)
  }, [tabId])

  const filteredLogs = useMemo(() => logs.filter(log => (filterCategory === 'all' || extractCategory(log) === filterCategory) && (searchText === '' || log.toLowerCase().includes(searchText.toLowerCase()))), [logs, filterCategory, searchText])
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    logs.forEach(log => { counts[extractCategory(log)] = (counts[extractCategory(log)] || 0) + 1 })
    return counts
  }, [logs])
  const copy = async (text: string) => await navigator.clipboard.writeText(text)
  const copyLog = async (log: string, index: number) => { await copy(log); setCopiedLog(index); setTimeout(() => setCopiedLog(null), 1000) }
  const toggleSelect = (i: number) => { const newSelected = new Set(selectedLogs); if (newSelected.has(i)) newSelected.delete(i); else newSelected.add(i); setSelectedLogs(newSelected) }

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-white border-b border-slate-200 p-2 space-y-2 z-10">
        <LogsHeader
          onCopyAll={() => copy(logs.join('\n'))}
          onCopyFiltered={() => copy(filteredLogs.join('\n'))}
          onCopySelected={() => copy(Array.from(selectedLogs).map(i => filteredLogs[i]).join('\n'))}
          onClear={async () => { if (tabId) { await clearLogs(tabId); setSelectedLogs(new Set()) } }}
          onCopyReport={async () => { const txt = await buildBugReport().catch(()=> ''); if (txt) await copy(txt) }}
          selectedCount={selectedLogs.size}
        />
        <LogsFilters
          searchText={searchText}
          onSearchChange={setSearchText}
          filterCategory={filterCategory}
          onFilterChange={setFilterCategory}
          categoryCounts={categoryCounts}
          totalLogs={logs.length}
          onSelectAll={() => setSelectedLogs(new Set(filteredLogs.map((_, i) => i)))}
          onDeselectAll={() => setSelectedLogs(new Set())}
        />
      </div>
      <div className="flex-1 overflow-auto bg-slate-50 p-2">
        <LogsList logs={filteredLogs} selectedLogs={selectedLogs} copiedLog={copiedLog} onToggleSelect={toggleSelect} onCopy={copyLog} />
      </div>
      <div className="border-t border-slate-200 p-2 text-xs text-gray-600 bg-white">
        <div className="flex items-center justify-between">
          <span>Total: {logs.length} logs</span>
          <span>Filtered: {filteredLogs.length} logs</span>
          <span>Selected: {selectedLogs.size} logs</span>
        </div>
      </div>
    </div>
  )
}
