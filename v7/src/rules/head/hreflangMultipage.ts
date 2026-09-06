import { checkHreflangTarget, HREFLANG_SELECTOR, resolveHttpHref } from './hreflangTarget'
import type { HreflangCheck, HreflangTarget } from './hreflangTarget'

import type { Rule } from '@/core/types'
import { runPool } from '@/core/rulePool'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'

const LABEL = 'HEAD'
const NAME = 'Hreflang Multipage Validation'
const RULE_ID = 'head:hreflang-multipage'

export const hreflangMultipageRule: Rule = {
  id: RULE_ID, name: NAME, enabled: true, what: 'static', timeout: { mode: 'multipage' },
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/specialty/international/localized-versions',
      'https://developers.google.com/search/docs/crawling-indexing/http-network-errors',
    ],
    description: 'Checks every declared hreflang target, reusing duplicate URLs with two concurrent requests; validates status, redirects, self/back references, canonical and noindex evidence.',
  },
  async run(page, ctx) {
    const all = Array.from(page.doc.querySelectorAll(HREFLANG_SELECTOR))
    const head = all.filter((element) => element.parentElement?.tagName.toLowerCase() === 'head')
    const links = head.length ? head : all
    if (!links.length) return { label: LABEL, name: NAME, message: 'No hreflang links to validate.', type: 'info', priority: 900 }
    const base = page.baseUri || page.url
    const canonicalHref = page.doc.querySelector('head > link[rel~="canonical" i]')?.getAttribute('href') || ''
    const declaredCanonical = resolveHttpHref(canonicalHref, base)
    const canonical = declaredCanonical || page.url
    const issues: Array<{ level: 'warn' | 'error'; text: string }> = []
    if (canonicalHref && !declaredCanonical) issues.push({ level: 'warn', text: 'Invalid source canonical; return links are compared with the page URL.' })
    if (!head.length) issues.push({ level: 'warn', text: 'Hreflang markup is outside the head.' })
    const targets = new Map<string, HreflangTarget>()
    const malformed: Array<{ hreflang: string; href: string }> = []
    let selfHreflang = ''
    for (const link of links) {
      const raw = link.getAttribute('href') || ''
      const hreflang = (link.getAttribute('hreflang') || '').trim()
      const href = resolveHttpHref(raw, base)
      if (!href) { malformed.push({ hreflang, href: raw }); continue }
      if (href === canonical) { selfHreflang = hreflang; continue }
      const previous = targets.get(href)
      if (previous) previous.declarations.push(hreflang)
      else targets.set(href, { href, hreflang, declarations: [hreflang] })
    }
    if (!selfHreflang) issues.push({ level: 'error', text: 'No onpage hreflang self reference to canonical URL.' })
    if (malformed.length) issues.push({ level: 'error', text: `${malformed.length} invalid or empty hreflang target URLs.` })
    const ordered = Array.from(targets.values())
    const checked: HreflangCheck[] = []
    await runPool({ tasks: ordered.map((target, index) => ({ target, index })), concurrency: 2, signal: ctx.signal,
      run: async ({ target, index }) => { checked[index] = await checkHreflangTarget(target, { canonical, doc: page.doc }, ctx.signal) } })
    checked.forEach((check) => issues.push(...check.issues))
    const type = issues.some((issue) => issue.level === 'error') ? 'error' : issues.length ? 'warn' : 'info'
    const issueTexts = issues.map((issue) => issue.text)
    const sourceHtml = extractHtmlFromList(links)
    return {
      label: LABEL, name: NAME, type, priority: type === 'error' ? 80 : type === 'warn' ? 200 : 709,
      message: issueTexts.length ? `Link-Rel-Alternate-Hreflang: ${issueTexts.join(' ')}`
        : `All ${checked.length} distinct remote hreflang targets checked successfully.`,
      details: { sourceHtml, snippet: extractSnippet(sourceHtml, 200), domPaths: getDomPaths(links), canonical,
        canonicalHref: canonicalHref || null, selfHreflang: selfHreflang || null, declarationCount: links.length,
        targetCount: ordered.length, checkedCount: checked.length, malformed, sampling: 'none',
        checked: checked.map((check) => ({ ...check, issues: check.issues.map((issue) => issue.text) })), issues: issueTexts },
    }
  },
}
