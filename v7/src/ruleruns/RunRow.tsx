import React from 'react'

import type { RunState } from '@/background/rules/runState'

interface Props {
  run: RunState
}

export const RunRow = ({ run }: Props): React.JSX.Element => {
  const formatTime = (iso: string): string => {
    const date = new Date(iso)
    return date.toLocaleTimeString()
  }

  const statusColor = {
    completed: 'text-green-700 bg-green-50',
    running: 'text-blue-700 bg-blue-50',
    pending: 'text-yellow-700 bg-yellow-50',
    aborted: 'text-gray-700 bg-gray-50',
    error: 'text-red-700 bg-red-50',
  }[run.status]

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <code className="text-xs text-gray-600">{run.runId}</code>
      </td>
      <td className="px-4 py-3">
        <span className="text-gray-900">{run.tabId}</span>
      </td>
      <td className="px-4 py-3 max-w-md truncate">
        <a
          href={run.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {run.url}
        </a>
      </td>
      <td className="px-4 py-3">
        <code className="text-xs text-gray-600">{run.triggeredBy}</code>
      </td>
      <td className="px-4 py-3 text-gray-600">{formatTime(run.startedAt)}</td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>{run.status}</span>
      </td>
      <td className="px-4 py-3 text-right text-gray-900">{run.resultCount ?? '-'}</td>
    </tr>
  )
}
