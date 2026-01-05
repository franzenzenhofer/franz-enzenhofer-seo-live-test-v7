import { useState, useEffect } from 'react'

import { RunNow } from './RunNow'

import { LiveTestHeader } from '@/components/LiveTestHeader'
import { openUrlInCurrentTab } from '@/shared/openUrlInCurrentTab'
import type { RunStatus } from '@/shared/runStatus'

type Props = {
  url: string
  runId?: string
  ranAt?: string
  status?: RunStatus
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
  onOpenReport,
  onClean,
  onOpenLogs,
  onOpenSettings,
  debugEnabled,
}: Props) => {
  const version = chrome.runtime.getManifest().version
  const [editableUrl, setEditableUrl] = useState(url || '')

  useEffect(() => {
    setEditableUrl(url || '')
  }, [url])

  return (
    <LiveTestHeader
      url={url}
      editableUrl={editableUrl}
      onUrlChange={setEditableUrl}
      runId={runId}
      ranAt={ranAt}
      runStatus={status}
      version={version}
      primaryAction={<RunNow url={editableUrl} onUrlNormalized={setEditableUrl} />}
      onOpenUrl={openUrlInCurrentTab}
      onOpenReport={onOpenReport}
      secondaryActions={
        <>
          <button className="text-blue-600 hover:text-blue-800 underline font-semibold" onClick={onOpenReport}>
            Open Full Report
          </button>
          <button className="text-gray-600 hover:text-gray-900 underline" onClick={onClean}>
            Clean
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
