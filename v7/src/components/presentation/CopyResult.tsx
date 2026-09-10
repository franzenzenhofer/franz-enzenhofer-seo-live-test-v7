import { useState } from 'react'

import { Icon } from './Icon'
import { actionClass } from './styles'

export const CopyResult = ({ content }: { content: string }) => {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const copy = async () => {
    try { await navigator.clipboard.writeText(content); setState('copied') } catch { setState('failed') }
  }
  return <>
    <button type="button" className={actionClass} onClick={copy} aria-label="Copy result" title="Copy result"><Icon name={state === 'copied' ? 'check' : 'copy'} /></button>
    <span role="status" className="sr-only">{state === 'copied' ? 'Result copied' : state === 'failed' ? 'Clipboard unavailable. Select and copy the report text.' : ''}</span>
    {state === 'failed' && <div role="dialog" aria-modal="false" aria-label="Copy result text" className="absolute inset-x-2 top-10 z-30 rounded-lg border border-slate-300 bg-white p-3 shadow-lg">
      <p className="mb-2 text-sm text-slate-700">Clipboard unavailable. Select and copy this report.</p>
      <pre tabIndex={0} className="max-h-96 overflow-auto whitespace-pre-wrap break-words text-sm text-slate-900">{content}</pre>
      <button type="button" className={`${actionClass} mt-2 border border-slate-300`} onClick={() => setState('idle')}>Close</button>
    </div>}
  </>
}
