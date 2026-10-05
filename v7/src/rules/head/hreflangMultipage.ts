import { markupReason, overviewMarkup, webUrlField } from './canonicalHreflangPresentation'
import { linkFields } from './hreflangMultipage.evidence'
import { checkHreflangTarget, HREFLANG_SELECTOR, resolveHttpHref } from './hreflangTarget'
import type { HreflangCheck, HreflangTarget } from './hreflangTarget'

import type { Rule } from '@/core/types'
import { runPool } from '@/core/rulePool'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
import { presentResult } from '@/shared/presentation/result'

// Every declared link ships its record; the storage bound keeps as many whole records as fit (F5).
const INVENTORY_LIMIT = 1000
const checked = [
  textField('Selector', HREFLANG_SELECTOR),
  textField('Selection', 'All matches'),
  textField('Target sampling', 'None - every distinct declared target is checked'),
  textField('Concurrency', '2 simultaneous target requests'),
  textField('Operation', 'Fetch each distinct target; verify status, redirect chain, self reference, back reference to canonical, target canonical, and noindex for Googlebot'),
  textField('Criterion', 'Every distinct target resolves with a self reference, a back reference to canonical, no noindex, and no error'),
]

export const hreflangMultipageRule: Rule = {
  id: 'head:hreflang-multipage', name: 'Hreflang Multipage Validation', presentation: 1, enabled: true, what: 'static', timeout: { mode: 'multipage' },
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
    if (!links.length) return presentResult(hreflangMultipageRule, page, {
      input: 'Static DOM', type: 'info', priority: 900,
      values: [textField('Hreflang links', 0)], checked,
      noMarkup: 'No hreflang links to validate',
    })
    const base = page.baseUri || page.url
    const canonicalHref = page.doc.querySelector('head > link[rel~="canonical" i]')?.getAttribute('href') || ''
    const declaredCanonical = resolveHttpHref(canonicalHref, base)
    const canonical = declaredCanonical || page.url
    const issues: Array<{ level: 'warn' | 'error'; text: string }> = []
    if (canonicalHref && !declaredCanonical) issues.push({ level: 'warn', text: 'Invalid source canonical; return links are compared with the page URL.' })
    if (!head.length) issues.push({ level: 'warn', text: 'Hreflang markup is outside the head.' })
    const targets = new Map<string, HreflangTarget>()
    let malformed = 0
    let selfHreflang = ''
    for (const link of links) {
      const raw = link.getAttribute('href') || ''
      const hreflang = (link.getAttribute('hreflang') || '').trim()
      const href = resolveHttpHref(raw, base)
      if (!href) { malformed++; continue }
      if (href === canonical) { selfHreflang = hreflang; continue }
      const previous = targets.get(href)
      if (previous) previous.declarations.push(hreflang)
      else targets.set(href, { href, hreflang, declarations: [hreflang] })
    }
    if (!selfHreflang) issues.push({ level: 'error', text: 'No onpage hreflang self reference to canonical URL.' })
    if (malformed) issues.push({ level: 'error', text: `${malformed} invalid or empty hreflang target URLs.` })
    const ordered = Array.from(targets.values())
    const targetChecks: HreflangCheck[] = []
    await runPool({ tasks: ordered.map((target, index) => ({ target, index })), concurrency: 2, signal: ctx.signal,
      run: async ({ target, index }) => { targetChecks[index] = await checkHreflangTarget(target, { canonical, doc: page.doc }, ctx.signal) } })
    targetChecks.forEach((check) => issues.push(...check.issues))
    const type = issues.some((issue) => issue.level === 'error') ? 'error' : issues.length ? 'warn' : 'info'

    // One record per declared link, carrying the facts of the target it points to (F5, F7).
    const checks = new Map(targetChecks.map((check) => [check.href, check]))
    const cluster = { canonical, checks, resolve: (href: string) => resolveHttpHref(href, base) }
    const records = elementRecords(sampleElements(links, INVENTORY_LIMIT).sample, links.length, (element) => linkFields(element, base, cluster))
    return presentResult(hreflangMultipageRule, page, {
      input: ordered.length ? 'Static DOM + hreflang target HTTP responses' : 'Static DOM',
      type, priority: type === 'error' ? 80 : type === 'warn' ? 200 : 709,
      values: [
        webUrlField(declaredCanonical ? 'Canonical URL' : 'Current page URL', canonical),
        textField('Hreflang links', links.length),
        textField('Self hreflang', selfHreflang || 'Not found'),
        textField('Targets checked', ordered.length),
        textField('Issues found', issues.length),
        ...overviewMarkup(records.markup),
      ],
      detailValues: [...records.counts,
        ...(canonicalHref && !declaredCanonical ? [textField('Canonical link', 'Invalid href')] : []),
        textField('Malformed targets', malformed),
        textField('Markup location', head.length ? 'Inside <head>' : 'Outside <head>')],
      checked,
      evidence: records.evidence,
      markup: records.markup,
      noMarkup: markupReason(records, 'Complete original hreflang link markup not retained', 'No hreflang links to validate'),
    })
  },
}
