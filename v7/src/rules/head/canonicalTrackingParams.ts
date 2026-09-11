import type { Rule } from '@/core/types'
import { textField, urlField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const NAME = 'Canonical tracking params'
const RULE_ID = 'head:canonical-tracking-params'
const SELECTOR = 'link[rel~="canonical" i]'
const BAD_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'msclkid',
  'mc_cid', 'mc_eid', 'pk_campaign', 'pk_kwd', 'oly_anon_id', 'oly_enc_id', 'mkt_tok', 'icid',
]
const checkedNoHref = [
  textField('Selector', SELECTOR), textField('Selection', 'First matching canonical link'),
  textField('Criterion', 'Canonical URL contains none of the checked tracking parameters and uses HTTP(S)'),
]
const checkedWithParams = (paramList: string[]) => [
  textField('Selector', SELECTOR), textField('Selection', 'First matching canonical link'),
  textField('Resolution', 'Canonical href resolved against page URL'),
  textField('Parameter names', paramList.join(', ')),
  textField('Criterion', 'Canonical URL contains none of the checked tracking parameters and uses HTTP(S)'),
]
const safeUrlField = (key: string, value: string) => {
  try {
    const parsed = new URL(value)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return urlField(key, value)
  } catch { /* not an absolute, parseable URL */ }
  return textField(key, value)
}

export const canonicalTrackingParamsRule: Rule = {
  id: RULE_ID, name: NAME, presentation: 1, enabled: true, what: 'static',
  meta: {
    userGuide: {
      check: "Checks the declared preferred URL for a listed set of common campaign tracking parameters. Other query parameters may identify real content and are not automatically errors.",
      action: "Edit the canonical URL in the template or CMS to remove the named tracking parameters if they do not change the content. Keep parameters needed to identify the preferred page.",
    },
    provenance: 'general',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls',
      'https://developers.google.com/search/docs/crawling-indexing/url-structure',
    ],
    description: 'Warns when the canonical URL contains known tracking parameters (utm_*, gclid, fbclid, msclkid, etc., extensible via config); also warns on non-http(s) canonical schemes.',
  },
  async run(page, ctx) {
    const link = page.doc.querySelector(SELECTOR)
    const href = (link?.getAttribute('href') || '').trim()
    const captured = markupEvidence(link ? [link] : [], 'Canonical link')
    const evidence = captured.fields.length ? [{ name: 'Source', fields: captured.fields }] : []

    // Preserve the original control flow exactly: the no-href branch returns
    // before any config (extra tracking params) is ever parsed, so its
    // `checked` facts must not claim a parameter list was evaluated.
    if (!href) {
      return presentResult(canonicalTrackingParamsRule, page, {
        input: 'Static DOM', type: 'info', priority: 850,
        values: [textField('Canonical link', link ? 'Found without an href' : 'Not found')], checked: checkedNoHref, evidence,
        markup: captured.markup, noMarkup: link ? 'Complete original canonical markup not retained' : 'No canonical link element found',
      })
    }

    const extra = (ctx.globals as { variables?: { canonicalTrackingParamsExtra?: unknown } }).variables?.canonicalTrackingParamsExtra
    const extraParams = Array.isArray(extra) ? extra.map((param) => String(param)) : []
    const paramList = Array.from(new Set([...BAD_PARAMS, ...extraParams]))
    const checked = checkedWithParams(paramList)
    const input = 'Static DOM + Page URL'

    try {
      const resolved = new URL(href, page.url)
      const protocol = resolved.protocol.toLowerCase()
      if (protocol !== 'http:' && protocol !== 'https:') {
        return presentResult(canonicalTrackingParamsRule, page, {
          input, type: 'warn', priority: 200,
          values: [textField('Canonical URL (resolved)', resolved.toString()), textField('URL scheme', 'Non-HTTP(S)')],
          detailValues: [textField('Canonical href (observed)', href), safeUrlField('Page URL', page.url)], checked, evidence,
          markup: captured.markup, noMarkup: 'Complete original canonical markup not retained',
        })
      }
      const canonicalUrl = resolved.toString()
      const offenders = paramList.filter((param) => resolved.searchParams.has(param))
      return presentResult(canonicalTrackingParamsRule, page, {
        input, type: offenders.length ? 'warn' : 'ok', priority: offenders.length ? 180 : 800,
        values: [urlField('Canonical URL', canonicalUrl), textField('Checked parameters', paramList.length),
          textField('Offending parameters', offenders.join(', ') || 'None')],
        detailValues: [textField('Canonical href (observed)', href), safeUrlField('Page URL', page.url)], checked, evidence,
        markup: captured.markup, noMarkup: 'Complete original canonical markup not retained',
      })
    } catch {
      return presentResult(canonicalTrackingParamsRule, page, {
        input, type: 'warn', priority: 200,
        values: [textField('Canonical href (observed)', href), textField('URL status', 'Invalid URL')],
        detailValues: [safeUrlField('Page URL', page.url)], checked, evidence,
        markup: captured.markup, noMarkup: 'Complete original canonical markup not retained',
      })
    }
  },
}
