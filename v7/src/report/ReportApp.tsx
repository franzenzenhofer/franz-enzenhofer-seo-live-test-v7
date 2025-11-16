import { ReportSection } from './ReportSection'
import { useReportData } from './useReportData'
import { ReportExportButtons } from './ExportButtons'
import { ResultBadges } from './ResultBadges'
import { ResultSummary } from './ResultSummary'
import { groupResults } from './groupResults'

import { LiveTestHeader } from '@/components/LiveTestHeader'
import { openUrlInCurrentTab } from '@/shared/openUrlInCurrentTab'
import { rulesInventory } from '@/rules/inventory'

export const ReportApp = () => {
  const { results, runMeta, loading } = useReportData()
  const sortedGroups = groupResults(results)
  const counts = results.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const presentIds = new Set(results.map((r) => r.ruleId).filter(Boolean))
  const missingRules = rulesInventory.filter((rule) => !presentIds.has(rule.id))
  const version = chrome.runtime.getManifest().version

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto p-4 sm:p-6">
          <h1 className="text-2xl font-semibold">Loading Report...</h1>
        </div>
      </div>
    )
  }

  if (!results.length) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto p-4 sm:p-6">
          <h1 className="text-2xl font-semibold mb-2">No Results Found</h1>
          <p className="text-sm text-gray-600">Run a test from the extension to see results here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto">
        <LiveTestHeader
          url={runMeta?.url || ''}
          runId={runMeta?.runId}
          ranAt={runMeta?.ranAt}
          version={version}
          onOpenUrl={openUrlInCurrentTab}
          secondaryActions={
            <>
              <span className="text-gray-600">{results.length} results</span>
              <ReportExportButtons url={runMeta?.url || ''} results={results} />
            </>
          }
        />
        <div className="p-4 sm:p-6 space-y-6">
          <ResultSummary totalRules={rulesInventory.length} resultsCount={results.length} missing={missingRules} />
          <ResultBadges counts={counts} />
          {sortedGroups.map(([type, items]) => (
            <ReportSection key={type} type={type} items={items} />
          ))}
        </div>
      </div>
    </div>
  )
}
