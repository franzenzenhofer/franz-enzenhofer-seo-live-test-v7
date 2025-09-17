import { PageInfo, type PageInfoT } from '@/shared/schemas'
import { extractPageInfo } from '@/shared/extract'

const q = (sel: string) => document.querySelector(sel)
const send = (event: string, data: unknown) => chrome.runtime.sendMessage({ event, data })

document.addEventListener('DOMContentLoaded', () => {
  send('DOMContentLoaded', { html: q('html')?.innerHTML, location })
})
window.addEventListener('load', () => {
  send('load', { html: q('html')?.innerHTML, location })
})
send('document_end', { html: q('html')?.innerHTML, location })
send('document_idle', { html: q('html')?.innerHTML, location })

chrome.runtime.onMessage.addListener((msg, _s, reply) => {
  if (msg?.type !== 'getPageInfo') return
  const data = PageInfo.parse(extractPageInfo())
  reply(data satisfies PageInfoT)
  return true
})

// Expose sidepanel URL only in Dev builds for E2E; avoid CSP violations in production pages.
try {
  const m = chrome.runtime.getManifest()
  const vn = (m as unknown as { version_name?: string }).version_name || ''
  if (m?.name?.includes('(Dev)') || vn.includes('dev')) {
    const u = chrome.runtime.getURL('src/sidepanel.html')
    const s = document.createElement('script')
    s.textContent = `window.__LT_SIDEPANEL_URL__=${JSON.stringify(u)}`
    const parent = document.documentElement || document.head || document.body
    if (parent) parent.appendChild(s)
    s.remove()
  }
} catch { /* ignore */ }
