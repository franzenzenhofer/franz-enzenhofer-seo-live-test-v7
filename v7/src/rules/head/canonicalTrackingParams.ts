import { canonicalRows, hrefField, markupReason } from './canonicalHreflangPresentation'

import type { Rule } from '@/core/types'
import { textField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
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
    const records = elementRecords(link ? [link] : [], link ? 1 : 0, (element) => [hrefField(element, page.url)])
    const base = { detailValues: link ? records.counts : [], evidence: records.evidence, markup: records.markup,
      noMarkup: markupReason(records, 'Complete original canonical markup not retained', 'No canonical link element found') }

    // Preserve the original control flow exactly: the no-href branch returns
    // before any config (extra tracking params) is ever parsed, so its
    // `checked` facts must not claim a parameter list was evaluated.
    if (!href) {
      return presentResult(canonicalTrackingParamsRule, page, {
        ...base, input: 'Static DOM', type: 'info', priority: 850,
        values: [textField('Canonical link', link ? 'Found without an href' : 'Not found'), ...records.markup], checked: checkedNoHref,
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
          ...base, input, type: 'warn', priority: 200,
          values: [...canonicalRows(href, null, 'Invalid HTTP(S) URL'), textField('URL scheme', protocol), ...records.markup], checked,
        })
      }
      const offenders = paramList.filter((param) => resolved.searchParams.has(param))
      return presentResult(canonicalTrackingParamsRule, page, {
        ...base, input, type: offenders.length ? 'warn' : 'ok', priority: offenders.length ? 180 : 800,
        values: [...canonicalRows(href, resolved.toString()), textField('Offending parameters', offenders.join(', ') || 'None'), ...records.markup], checked,
      })
    } catch {
      return presentResult(canonicalTrackingParamsRule, page, {
        ...base, input, type: 'warn', priority: 200,
        values: [...canonicalRows(href, null), ...records.markup], checked,
      })
    }
  },
}
