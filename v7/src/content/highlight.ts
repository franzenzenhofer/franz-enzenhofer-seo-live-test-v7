const HIGHLIGHT_CLASS = 'lt-highlight-target'
const DEFAULT_COLORS = ['#f97316', '#2563eb', '#22c55e', '#f43f5e']

let highlightedEls: Element[] = []

const ensureHighlightStyle = () => {
  if (document.getElementById('lt-highlight-style')) return
  const style = document.createElement('style')
  style.id = 'lt-highlight-style'
  style.textContent = `.${HIGHLIGHT_CLASS}{outline:2px solid var(--lt-highlight-color, #f97316)!important;outline-offset:2px!important;transition:outline .15s ease}`
  document.head.appendChild(style)
}

const highlightSelectors = (selectors: string[], colors?: string[]) => {
  ensureHighlightStyle()
  const palette: string[] = colors && colors.length ? colors : DEFAULT_COLORS
  clearHighlight()
  selectors.forEach((selector, idx) => {
    const el = document.querySelector(selector)
    if (!el) return
    const colorIndex = palette.length ? idx % palette.length : 0
    const color = (palette[colorIndex] ?? DEFAULT_COLORS[0]) as string
    el.classList.add(HIGHLIGHT_CLASS)
    el.setAttribute('data-highlight-idx', String(idx))
    el.setAttribute('data-highlight-color', color)
    ;(el as HTMLElement).style.setProperty('--lt-highlight-color', color)
    highlightedEls.push(el)
  })
  return highlightedEls.length > 0
}

const clearHighlight = () => {
  highlightedEls.forEach((el) => {
    el.classList.remove(HIGHLIGHT_CLASS)
    el.removeAttribute('data-highlight-idx')
    el.removeAttribute('data-highlight-color')
    ;(el as HTMLElement).style.removeProperty('--lt-highlight-color')
  })
  highlightedEls = []
}

export const handleHighlightMessage = (msg: unknown, reply?: (response: { ok: boolean; matched?: number; first?: string }) => void) => {
  const payload = msg as { type?: string; selector?: string; selectors?: string[]; colors?: string[] }
  if (payload?.type === 'highlight-selector') {
    const selectors = Array.isArray(payload.selectors) ? payload.selectors : payload.selector ? [payload.selector] : []
    const ok = selectors.length > 0 && highlightSelectors(selectors, payload.colors)
    reply?.({ ok, matched: highlightedEls.length, first: selectors[0] })
    return true
  }
  if (payload?.type === 'clear-highlight') {
    clearHighlight()
    reply?.({ ok: true, matched: 0 })
    return true
  }
  return false
}
