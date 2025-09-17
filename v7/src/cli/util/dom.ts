import { JSDOM } from 'jsdom'

export const parseHtml = (html: string) => new JSDOM(html)
export const parseTitle = (html: string) => {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || ['', '']
  return (m[1] ?? '').trim()
}

