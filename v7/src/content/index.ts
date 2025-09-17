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
