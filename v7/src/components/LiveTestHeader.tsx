import type { ReactNode } from 'react'

import { HeaderUrlSection } from './HeaderUrlSection'

export type LiveTestHeaderProps = {
  url: string
  runId?: string
  ranAt?: string
  version?: string
  primaryAction?: ReactNode
  secondaryActions?: ReactNode
  onOpenUrl?: (url: string) => void
}

export const LiveTestHeader = ({
  url,
  runId,
  ranAt,
  version,
  primaryAction,
  secondaryActions,
  onOpenUrl,
}: LiveTestHeaderProps) => {
  return (
    <div className="border-b bg-white">
      <div className="p-4 space-y-4">
        <div className="space-y-1">
          <h1 className="text-lg font-bold text-gray-900">Franz Enzenhofer SEO Live Test</h1>
          {version && <div className="text-xs text-gray-500">v{version}</div>}
        </div>

        <HeaderUrlSection url={url} runId={runId} ranAt={ranAt} onOpenUrl={onOpenUrl} />

        {primaryAction && <div className="pt-2">{primaryAction}</div>}

        {secondaryActions && <div className="flex items-center gap-4 text-sm pt-2">{secondaryActions}</div>}
      </div>
    </div>
  )
}
