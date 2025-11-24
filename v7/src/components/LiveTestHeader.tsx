import type { ReactNode } from 'react'

import { HeaderUrlSection } from './HeaderUrlSection'

export type LiveTestHeaderProps = {
  url: string
  editableUrl?: string
  onUrlChange?: (url: string) => void
  runId?: string
  ranAt?: string
  version?: string
  primaryAction?: ReactNode
  secondaryActions?: ReactNode
  onOpenUrl?: (url: string) => void
  onOpenReport?: () => void
}

export const LiveTestHeader = ({
  url,
  editableUrl,
  onUrlChange,
  runId,
  ranAt,
  version,
  primaryAction,
  secondaryActions,
  onOpenUrl,
  onOpenReport,
}: LiveTestHeaderProps) => {
  return (
    <div className="border-b bg-white">
      <div className="p-3 space-y-2">
        <div className="flex items-end justify-between gap-2">
          <div className="flex items-center gap-2">
            <img
              src={chrome.runtime.getURL('src/icons/icon-32.png')}
              alt="FE logo"
              className="h-6 w-6"
            />
            <h1 className="text-base font-bold text-gray-900">Franz Enzenhofer SEO Live Test</h1>
          </div>
          {version && <span className="text-[10px] uppercase tracking-wide text-gray-400">v{version}</span>}
        </div>

        <HeaderUrlSection
          editableUrl={editableUrl || url}
          onUrlChange={onUrlChange || (() => {})}
          runId={runId}
          ranAt={ranAt}
          onOpenUrl={onOpenUrl}
          onOpenReport={onOpenReport}
        />

        {primaryAction && <div>{primaryAction}</div>}

        {secondaryActions && <div className="flex flex-wrap items-center gap-3 text-sm">{secondaryActions}</div>}
      </div>
    </div>
  )
}
