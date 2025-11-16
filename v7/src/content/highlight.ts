const HIGHLIGHT_CLASS = 'lt-highlight-target'

let highlightedEl: Element | null = null

const ensureHighlightStyle = () => {
  if (document.getElementById('lt-highlight-style')) return
  const style = document.createElement('style')
  style.id = 'lt-highlight-style'
  style.textContent = `.${HIGHLIGHT_CLASS}{outline:2px solid #f43f5e!important;outline-offset:2px!important;transition:outline .15s ease}`
  document.head.appendChild(style)
}

const highlightSelector = (selector: string) => {
  ensureHighlightStyle()
  const el = document.querySelector(selector)
  if (!el) return false
  if (highlightedEl) highlightedEl.classList.remove(HIGHLIGHT_CLASS)
  highlightedEl = el
  el.classList.add(HIGHLIGHT_CLASS)
  return true
}

const clearHighlight = () => {
  if (highlightedEl) highlightedEl.classList.remove(HIGHLIGHT_CLASS)
  highlightedEl = null
}

export const handleHighlightMessage = (msg: unknown, reply?: (response: { ok: boolean }) => void) => {
  const payload = msg as { type?: string; selector?: string }
  if (payload?.type === 'highlight-selector') {
    const ok = typeof payload.selector === 'string' && payload.selector.length > 0 && highlightSelector(payload.selector)
    reply?.({ ok })
    return true
  }
  if (payload?.type === 'clear-highlight') {
    clearHighlight()
    reply?.({ ok: true })
    return true
  }
  return false
}
