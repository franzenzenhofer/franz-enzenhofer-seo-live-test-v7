import React, { useState } from 'react'

import { executeRunNow } from '../utils/runNow'

import { ValidationMessage } from '@/shared/components/ValidationMessage'
import type { ValidationResult } from '@/shared/validation-types'

type Props = {
  url?: string
  onUrlNormalized?: (next: string) => void
  /** The run meta says the run is starting (RunStarting.isRunStarting): keep the button busy. */
  starting?: boolean
}

export const RunNow = ({ url, onUrlNormalized, starting = false }: Props) => {
  const [clicking, setClicking] = useState(false)
  const [error, setError] = useState<ValidationResult | null>(null)
  // Busy from the click until the run has visible rows, not just until the navigation was issued.
  const busy = clicking || starting

  const run = async () => {
    setClicking(true)
    setError(null)
    try {
      const normalized = await executeRunNow(url)
      if (normalized && onUrlNormalized) onUrlNormalized(normalized)
    } catch (err) {
      console.warn('[panel] Run Now failed', err)
      const message = err instanceof Error ? err.message : 'Run failed'
      setError({ valid: false, message, type: 'error' })
    } finally {
      setClicking(false)
    }
  }

  return (
    <div>
      <button
        className={`w-full px-4 py-2 text-sm font-semibold rounded transition-colors ${
          busy ? 'bg-blue-100 text-blue-700 cursor-wait' : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
        onClick={run}
        disabled={busy}
        aria-busy={busy}
        title="Hard reloads the page and clears cache"
      >
        {busy ? 'Starting test…' : 'Run test'}
      </button>
      <ValidationMessage result={error} />
    </div>
  )
}
