import { checkedTargets, generalFindings, malformedTargets } from './hreflangMultipage.evidence'
import { checkHreflangTarget, HREFLANG_SELECTOR, resolveHttpHref } from './hreflangTarget'
import type { HreflangCheck, HreflangTarget } from './hreflangTarget'

import type { Rule } from '@/core/types'
import { runPool } from '@/core/rulePool'
import { sampleElements } from '@/shared/domEvidence'
import { textField, urlField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const httpUrlField = (key: string, value: string) => {
  try { return ['http:', 'https:'].includes(new URL(value).protocol) ? urlField(key, value) : textField(key, value) } catch { return textField(key, value || 'Not resolved') }
}

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
      values: [textField('Hreflang targets declared', 0)], checked,
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
    const targetChecks: HreflangCheck[] = []
    await runPool({ tasks: ordered.map((target, index) => ({ target, index })), concurrency: 2, signal: ctx.signal,
      run: async ({ target, index }) => { targetChecks[index] = await checkHreflangTarget(target, { canonical, doc: page.doc }, ctx.signal) } })
    targetChecks.forEach((check) => issues.push(...check.issues))
    const type = issues.some((issue) => issue.level === 'error') ? 'error' : issues.length ? 'warn' : 'info'
    const captured = markupEvidence(sampleElements(links).sample, 'Hreflang link markup')
    return presentResult(hreflangMultipageRule, page, {
      input: ordered.length ? 'Static DOM + hreflang target HTTP responses' : 'Static DOM',
      type, priority: type === 'error' ? 80 : type === 'warn' ? 200 : 709,
      values: [textField('Hreflang targets declared', links.length), textField('Distinct targets checked', ordered.length), textField('Issues found', issues.length)],
      detailValues: [httpUrlField('Canonical URL used for comparison', canonical),
        textField('Declared canonical href', canonicalHref || 'Not declared'),
        textField('Self hreflang', selfHreflang || 'Not found'),
        textField('Malformed target URLs', malformed.length),
        textField('Hreflang markup location', head.length ? 'Inside <head>' : 'Outside <head>'),
        textField('Hreflang link markup retained', captured.markup.length),
        textField('Hreflang link markup omitted', links.length - captured.markup.length)],
      checked,
      evidence: [...generalFindings(issues.filter((issue) => !targetChecks.some((check) => check.issues.includes(issue)))),
        ...malformedTargets(malformed), ...checkedTargets(targetChecks)],
      markup: captured.markup,
      noMarkup: 'Complete original hreflang link markup not retained',
    })
  },
}
