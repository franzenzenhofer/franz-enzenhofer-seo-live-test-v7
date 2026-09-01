import type { ReactNode } from 'react'

/**
 * The single presentation for a piece of captured evidence. Used both for the
 * value shown under a collapsed verdict and for the full snippet in the
 * expanded view, so the two never drift apart.
 */
export const EvidenceBox = ({ children, testId, title }: { children: ReactNode; testId?: string; title?: string }) => (
  <pre
    className="text-xs bg-white/70 border rounded p-2 whitespace-pre-wrap break-words text-slate-700"
    data-testid={testId}
    title={title}
  >
    {children}
  </pre>
)
