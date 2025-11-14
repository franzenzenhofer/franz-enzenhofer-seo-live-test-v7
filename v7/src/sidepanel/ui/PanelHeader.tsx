import { useState, useEffect } from 'react'

import { RunNow } from './RunNow'

import { LiveTestHeader } from '@/components/LiveTestHeader'
import { openUrlInCurrentTab } from '@/shared/openUrlInCurrentTab'

type Props = {
  url: string
  runId?: string
  ranAt?: string
  onOpenReport: () => void
  onClean: () => void
  onOpenLogs: () => void
  onOpenSettings: () => void
}

export const PanelHeader = ({ url, runId, ranAt, onOpenReport, onClean, onOpenLogs, onOpenSettings }: Props) => {
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
      version={version}
      primaryAction={<RunNow url={editableUrl} />}
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
          <button className="text-gray-600 hover:text-gray-900 underline" onClick={onOpenLogs}>
            Logs
          </button>
          <button className="text-gray-600 hover:text-gray-900 underline" onClick={onOpenSettings}>
            Settings
          </button>
        </>
      }
    />
  )
}
