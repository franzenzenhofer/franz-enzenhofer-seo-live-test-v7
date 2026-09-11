import { PageChangedNotice } from './PageChangedNotice'
import { RunNow } from './RunNow'
import { useCurrentPageUrl } from './useCurrentPageUrl'
import { useRunTarget } from './useRunTarget'

import { LiveTestHeader } from '@/components/LiveTestHeader'
import { openUrlInCurrentTab } from '@/shared/openUrlInCurrentTab'
import type { RunStatus } from '@/shared/runStatus'

type Props = {
  url: string
  runId?: string
  ranAt?: string
  status?: RunStatus
  starting: boolean
  onOpenReport: () => void
  onClean: () => void
  onOpenLogs: () => void
  onOpenSettings: () => void
  debugEnabled: boolean
}

export const PanelHeader = ({
  url,
  runId,
  ranAt,
  status,
  starting,
  onOpenReport,
  onClean,
  onOpenLogs,
  onOpenSettings,
  debugEnabled,
}: Props) => {
  const version = chrome.runtime.getManifest().version
  // The field and the header show the page the tab is on; `url` is the run's.
  const pageUrl = useCurrentPageUrl()
  const { editableUrl, runUrl, onUrlChange, onUrlLoaded } = useRunTarget(pageUrl ?? url, url)

  return (
    <LiveTestHeader
      url={pageUrl ?? url}
      notice={<PageChangedNotice pageUrl={pageUrl} runUrl={url} />}
      editableUrl={editableUrl}
      onUrlChange={onUrlChange}
      runId={runId}
      ranAt={ranAt}
      runStatus={status}
      version={version}
      primaryAction={<RunNow url={runUrl} onUrlLoaded={onUrlLoaded} starting={starting} />}
      onOpenUrl={openUrlInCurrentTab}
      onOpenReport={onOpenReport}
      secondaryActions={
        <>
          <button className="text-blue-600 hover:text-blue-800 underline font-semibold" onClick={onOpenReport}>
            Report
          </button>
          <button className="text-gray-600 hover:text-gray-900 underline" onClick={onClean}>
            Clear
          </button>
          {debugEnabled && (
            <button className="text-gray-600 hover:text-gray-900 underline" onClick={onOpenLogs}>
              Logs
            </button>
          )}
          <button className="text-gray-600 hover:text-gray-900 underline" onClick={onOpenSettings}>
            Settings
          </button>
        </>
      }
    />
  )
}
