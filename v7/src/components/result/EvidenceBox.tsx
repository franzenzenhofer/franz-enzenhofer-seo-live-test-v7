import type { ReactNode, ReactElement } from 'react'

import { useCopyFeedback } from './useCopyFeedback'

const TONES = {
  evidence: 'bg-white/70 text-xs text-slate-700',
  muted: 'bg-white/40 font-mono text-xs text-slate-500',
} as const

type Props = {
  children: ReactNode
  testId?: string
  title?: string
  /** The full raw value a click copies - not the truncated display form. */
  copyValue?: string
  tone?: keyof typeof TONES
}

/**
 * The single presentation for a piece of captured evidence, collapsed or
 * expanded, so the two never drift apart. Clicking it copies the full value.
 */
export const EvidenceBox = ({ children, testId, title, copyValue, tone = 'evidence' }: Props): ReactElement => {
  const { copied, copy } = useCopyFeedback()
  const value = copyValue ?? (typeof children === 'string' ? children : '')
  return (
    <button
      type="button"
      data-testid={testId}
      title={title ?? 'Click to copy'}
      aria-label="Copy this value"
      onClick={() => void copy(value)}
      className={`relative block w-full cursor-copy select-text whitespace-pre-wrap break-words rounded border p-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 ${TONES[tone]}`}
    >
      {children}
      {copied && (
        <span data-testid="copied-toast" className="absolute right-1 top-1 rounded bg-slate-800/90 px-1.5 py-0.5 text-xs font-semibold text-white">
          Copied
        </span>
      )}
    </button>
  )
}
