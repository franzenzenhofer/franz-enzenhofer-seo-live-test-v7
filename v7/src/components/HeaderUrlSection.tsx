import { useEffect, useRef, useState } from 'react'

import { formatEuropeanDateTime } from '@/shared/dateFormat'

export type HeaderUrlSectionProps = {
  url: string
  runId?: string
  ranAt?: string
  onOpenUrl?: (url: string) => void
}

export const HeaderUrlSection = ({ url, runId, ranAt, onOpenUrl }: HeaderUrlSectionProps) => {
  const [editableUrl, setEditableUrl] = useState(url || '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditableUrl(url || '')
    if (inputRef.current && url) {
      inputRef.current.scrollLeft = inputRef.current.scrollWidth
    }
  }, [url])

  const copy = async () => {
    if (!editableUrl) return
    try {
      await navigator.clipboard.writeText(editableUrl)
    } catch {
      /* ignore */
    }
  }

  const open = async () => {
    if (!editableUrl) return
    if (onOpenUrl) {
      onOpenUrl(editableUrl)
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="text"
          value={editableUrl}
          onChange={(e) => setEditableUrl(e.target.value)}
          placeholder="No URL yet"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          <button
            className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
            onClick={() => void copy()}
            disabled={!editableUrl}
          >
            Copy URL
          </button>
          <button
            className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
            onClick={() => void open()}
            disabled={!editableUrl}
          >
            Open URL
          </button>
        </div>
      </div>

      {(runId || ranAt) && (
        <div className="text-sm text-gray-600 space-y-0.5">
          {runId && <div>Run #{runId}</div>}
          {ranAt && <div>{formatEuropeanDateTime(ranAt)}</div>}
        </div>
      )}
    </div>
  )
}
