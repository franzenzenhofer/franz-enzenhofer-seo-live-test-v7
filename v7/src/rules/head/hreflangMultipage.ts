import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'

const LABEL = 'HEAD'
const NAME = 'Hreflang Multipage Validation'
const RULE_ID = 'head:hreflang-multipage'
const SELECTOR_HEAD = 'head > link[rel~="alternate" i][hreflang][href]'
const SELECTOR_ANY = 'link[rel~="alternate" i][hreflang][href]'
const SPEC = 'https://developers.google.com/search/docs/specialty/international/localized-versions'
const order = { info: 0, warn: 1, error: 2 }

const upgrade = (current: 'info' | 'warn' | 'error', next: 'info' | 'warn' | 'error') =>
  order[next] > order[current] ? next : current

export const hreflangMultipageRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    let links = Array.from(page.doc.querySelectorAll(SELECTOR_HEAD)) as HTMLLinkElement[]
    const fallback = Array.from(page.doc.querySelectorAll(SELECTOR_ANY)) as HTMLLinkElement[]
    const maybeInBody = !links.length && fallback.length > 0
    if (!links.length) links = fallback

    if (!links.length) {
      return { label: LABEL, name: NAME, message: 'No hreflang links to validate.', type: 'info', priority: 900, details: { reference: SPEC } }
    }

    const canonicalEl = (page.doc.querySelector('head > link[rel~="canonical" i]') || page.doc.querySelector('link[rel~="canonical" i]')) as HTMLLinkElement | null
    const canonicalHref = canonicalEl?.getAttribute('href')?.trim() || ''
    const canonical = new URL(canonicalHref || page.url, page.url).toString()
    const selfRef = links.find((l) => new URL(l.getAttribute('href') || '', page.url).toString() === canonical)
    const selfHreflang = selfRef?.getAttribute('hreflang')?.trim() || ''

    let type: 'info' | 'warn' | 'error' = 'info'
    const issues: string[] = []
    if (!canonicalHref) {
      issues.push('No valid canonical found. rel=alternate invalid when referenced with parameters.')
      type = upgrade(type, 'warn')
    }
    if (!selfRef) {
      issues.push('No onpage hreflang self reference to canonical URL.')
      type = upgrade(type, 'error')
    }
    if (maybeInBody) {
      issues.push('Markup may be in <body> or DOM parsing issue.')
      type = upgrade(type, 'warn')
    }

    const checks: Array<Promise<{ level: 'warn' | 'error'; text: string }[]>> = links
      .filter((link) => new URL(link.getAttribute('href') || '', page.url).toString() !== canonical)
      .map(async (link): Promise<{ level: 'warn' | 'error'; text: string }[]> => {
        const href = new URL(link.getAttribute('href') || '', page.url).toString()
        const hreflang = (link.getAttribute('hreflang') || '').trim()
        const ctrl = new AbortController()
        const t = setTimeout(() => ctrl.abort(), 10000)
        try {
          const res = await fetch(href, { redirect: 'follow', signal: ctrl.signal })
          clearTimeout(t)
          const messages: { level: 'warn' | 'error'; text: string }[] = []
          if (res.redirected) messages.push({ level: 'warn', text: `'${hreflang}' URL triggers redirect.` })
          if (res.status !== 200) {
            messages.push({ level: 'error', text: `'${hreflang}' returns HTTP ${res.status}.` })
            return messages
          }
          const body = await res.text()
          const dom = new DOMParser().parseFromString(body, 'text/html')
          const selfSelector = `link[rel~="alternate" i][hreflang="${hreflang}"][href="${href}"]`
          const backSelector = selfHreflang
            ? `link[rel~="alternate" i][hreflang="${selfHreflang}"][href="${canonical}"]`
            : `link[rel~="alternate" i][hreflang][href="${canonical}"]`
          if (!dom.querySelector(selfSelector)) messages.push({ level: 'error', text: `'${hreflang}' no self reference found.` })
          if (!dom.querySelector(backSelector)) messages.push({ level: 'error', text: `'${hreflang}' no back reference to canonical.` })
          return messages
        } catch (e) {
          clearTimeout(t)
          return [{ level: 'warn', text: `'${hreflang}' check failed: ${String(e)}` }]
        }
      })

    const results = await Promise.all(checks)
    results.flat().forEach(({ level, text }) => {
      type = upgrade(type, level)
      issues.push(text)
    })

    const message = issues.length
      ? `Link-Rel-Alternate-Hreflang: ${issues.join(' ')}`
      : 'Link-Rel-Alternate-Hreflang was checked successfully and is correct!'

    const sourceHtml = extractHtmlFromList(links)
    return {
      label: LABEL,
      name: NAME,
      message,
      type,
      priority: type === 'info' ? 709 : type === 'warn' ? 200 : 80,
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml, 200),
        domPaths: links.map((_, i) => (i === 0 ? SELECTOR_HEAD : `${SELECTOR_HEAD}:nth-of-type(${i + 1})`)),
        canonical,
        canonicalHref: canonicalHref || null,
        reference: SPEC,
      },
    }
  },
}
