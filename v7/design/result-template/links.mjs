import { escapeHtml } from './html.mjs'
import { pageUrl } from './fixtures.mjs'

const urlLink = value => {
  try {
    const url = new URL(value, pageUrl)
    if (!['http:', 'https:'].includes(url.protocol)) return escapeHtml(value)
    return `<a href="${escapeHtml(url.href)}" target="_blank" rel="noopener noreferrer" class="rounded-sm text-inherit hover:bg-slate-200/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-600" data-data-url>${escapeHtml(value)}</a>`
  } catch { return escapeHtml(value) }
}
export const linkedValue = value => {
  const text = String(value)
  if (/^\/(?!\s)\S*$/.test(text)) return urlLink(text)
  return text.split(/(https?:\/\/[^\s<>"']+)/g).map(part => /^https?:\/\//.test(part) ? urlLink(part) : escapeHtml(part)).join('')
}
