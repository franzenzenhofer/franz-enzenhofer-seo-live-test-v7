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
        <div className="space-y-0.5">
          <h1 className="text-base font-bold text-gray-900">Franz Enzenhofer SEO Live Test</h1>
          {version && <div className="text-xs text-gray-500">v{version}</div>}
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

        {secondaryActions && <div className="flex items-center gap-3 text-sm">{secondaryActions}</div>}
      </div>
    </div>
  )
}
