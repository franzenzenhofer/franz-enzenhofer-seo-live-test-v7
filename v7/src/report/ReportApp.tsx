import { useReportData } from './useReportData'
import { ReportExportButtons } from './ExportButtons'
import { ReportResultsSection } from './ReportResultsSection'

import { LiveTestHeader } from '@/components/LiveTestHeader'
import { openUrlInCurrentTab } from '@/shared/openUrlInCurrentTab'
import { useDebugFlag } from '@/shared/hooks/useDebugFlag'

export const ReportApp = () => {
  const { results, runMeta, loading, error } = useReportData()
  const version = chrome.runtime.getManifest().version
  const [debugEnabled] = useDebugFlag()

  if (loading || error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto p-4 sm:p-6">
          <h1 className={`text-2xl font-semibold${error ? ' mb-2 text-red-600' : ''}`}>
            {error ? 'Error' : 'Loading Report...'}
          </h1>
          {error && <p className="text-sm text-gray-600">{error}</p>}
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
          secondaryActions={<ReportExportButtons url={runMeta?.url || ''} results={results} />}
        />
        <ReportResultsSection results={results} debugEnabled={debugEnabled} />
      </div>
    </div>
  )
}
