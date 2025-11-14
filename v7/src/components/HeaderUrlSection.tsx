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
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.scrollLeft = inputRef.current.scrollWidth
        }
      }, 0)
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
    <div className="space-y-2">
      <div className="space-y-1">
        <input
          ref={inputRef}
          type="text"
          value={editableUrl}
          onChange={(e) => setEditableUrl(e.target.value)}
          placeholder="No URL yet"
          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <div className="flex gap-1">
          <button
            className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-40"
            onClick={() => void copy()}
            disabled={!editableUrl}
          >
            Copy URL
          </button>
          <button
            className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-40"
            onClick={() => void open()}
            disabled={!editableUrl}
          >
            Open URL
          </button>
        </div>
      </div>

      {(runId || ranAt) && (
        <div className="text-xs text-gray-600 space-y-0.5">
          {runId && <div>Run #{runId}</div>}
          {ranAt && <div>{formatEuropeanDateTime(ranAt)}</div>}
        </div>
      )}
    </div>
  )
}
