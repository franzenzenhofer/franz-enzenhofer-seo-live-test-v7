import { useEffect, useRef, useState } from 'react'

const CONFIRM_MS = 2000

/**
 * The panel's single copy-with-confirmation behaviour (same timing as the
 * header copy button and "Copy filtered"). Confirmation only appears when the
 * clipboard write actually succeeded.
 */
export const useCopyFeedback = (): { copied: boolean; copy: (value: string) => Promise<void> } => {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => () => clearTimeout(timer.current), [])
  const copy = async (value: string): Promise<void> => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), CONFIRM_MS)
    } catch {
      /* copy failed: never claim "Copied" */
    }
  }
  return { copied, copy }
}
