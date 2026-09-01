import type { Rule } from '@/core/types'
import { discardBody } from '@/shared/http-utils'
import { parseHtmlDocument } from '@/shared/parseHtml'
import { followRedirectChain } from '@/shared/redirectChain'
import { formatRedirectChain } from '@/shared/redirectChainFormat'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'
import type { RedirectChain } from '@/shared/redirectChainTypes'

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

    type LinkCheck = {
      hreflang: string; href: string; status?: number; redirected?: boolean
      selfReference?: boolean; backReference?: boolean; error?: string
      redirectChain?: RedirectChain; redirectChainText?: string
      issues: { level: 'warn' | 'error'; text: string }[]
    }
    const checks: Array<Promise<LinkCheck>> = links
      .filter((link) => new URL(link.getAttribute('href') || '', page.url).toString() !== canonical)
      .map(async (link): Promise<LinkCheck> => {
        const href = new URL(link.getAttribute('href') || '', page.url).toString()
        const hreflang = (link.getAttribute('hreflang') || '').trim()
        try {
          const { chain, response } = await followRedirectChain(href, { timeoutMs: 10000, wantBody: true })
          const chainText = formatRedirectChain(chain)
          const check: LinkCheck = {
            hreflang, href, status: chain.finalStatus, redirected: chain.redirected,
            redirectChain: chain, redirectChainText: chainText, issues: [],
          }
          if (chain.loop || chain.capped) {
            if (response) discardBody(response)
            const what = chain.loop ? 'enters a redirect loop' : `exceeds ${chain.maxHops} redirects`
            check.issues.push({ level: 'error', text: `'${hreflang}' URL ${what}:\n${chainText}` })
            return check
          }
          if (chain.redirected) check.issues.push({ level: 'warn', text: `'${hreflang}' URL triggers redirect:\n${chainText}` })
          if (chain.finalStatus !== 200) {
            if (response) discardBody(response)
            check.issues.push({ level: 'error', text: `'${hreflang}' returns HTTP ${chain.finalStatus}.` })
            return check
          }
          const body = response ? await response.text() : ''
          const dom = parseHtmlDocument(body, page.doc)
          const selfSelector = `link[rel~="alternate" i][hreflang="${hreflang}"][href="${href}"]`
          const backSelector = selfHreflang
            ? `link[rel~="alternate" i][hreflang="${selfHreflang}"][href="${canonical}"]`
            : `link[rel~="alternate" i][hreflang][href="${canonical}"]`
          check.selfReference = !!dom.querySelector(selfSelector)
          check.backReference = !!dom.querySelector(backSelector)
          if (!check.selfReference) check.issues.push({ level: 'error', text: `'${hreflang}' no self reference found.` })
          if (!check.backReference) check.issues.push({ level: 'error', text: `'${hreflang}' no back reference to canonical.` })
          return check
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          return { hreflang, href, error: msg, issues: [{ level: 'warn', text: `'${hreflang}' check failed: ${msg}` }] }
        }
      })

    const checked = await Promise.all(checks)
    checked.flatMap((check) => check.issues).forEach(({ level, text }) => {
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
        domPaths: getDomPaths(links),
        canonical,
        canonicalHref: canonicalHref || null,
        selfHreflang: selfHreflang || null,
        checked: checked.map(({ issues: linkIssues, ...check }) => ({ ...check, issues: linkIssues.map((i) => i.text) })),
        issues,
        reference: SPEC,
      },
    }
  },
}
