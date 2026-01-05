import React, { useState } from 'react'

import { executeRunNow } from '../utils/runNow'

import { ValidationMessage } from '@/shared/components/ValidationMessage'
import type { ValidationResult } from '@/shared/validation-types'

export const RunNow = ({ url, onUrlNormalized }: { url?: string; onUrlNormalized?: (next: string) => void }) => {
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<ValidationResult | null>(null)

  const run = async () => {
    setRunning(true)
    setError(null)
    try {
      const normalized = await executeRunNow(url)
      if (normalized && onUrlNormalized) onUrlNormalized(normalized)
    } catch (err) {
      console.warn('[panel] Run Now failed', err)
      const message = err instanceof Error ? err.message : 'Run failed'
      setError({ valid: false, message, type: 'error' })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div>
      <button
        className={`w-full px-4 py-2 text-sm font-semibold rounded transition-colors ${
          running ? 'bg-blue-100 text-blue-700 cursor-wait' : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
        onClick={run}
        disabled={running}
        title="Hard reloads the page and clears cache"
      >
        {running ? 'Running test…' : 'Run test'}
      </button>
      <ValidationMessage result={error} />
    </div>
  )
}
