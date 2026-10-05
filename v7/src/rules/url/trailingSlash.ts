import { hopEvidence, variantCanonical } from './trailingSlash.evidence'

import type { Rule, Result } from '@/core/types'
import { probeError } from '@/rules/body/elementInventory'
import { httpUrlField } from '@/rules/http/navigationStepEvidence'
import { discardBody } from '@/shared/http-utils'
import { httpStatusLabel } from '@/shared/httpStatusLabel'
import { parseHtmlDocument } from '@/shared/parseHtml'
import { differingComponent } from '@/shared/presentation/comparison'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { DisplayField, EvidenceRecord } from '@/shared/presentation/schema'
import { followRedirectChain } from '@/shared/redirectChain'
import { RedirectChainError } from '@/shared/redirectChainTypes'
import { HTML_RESPONSE_BYTES, readResponseText } from '@/shared/responseBody'

const NAME = 'URL trailing slash consistency'
const CHECKED = [
  textField('Probe', 'Fetch the opposite trailing-slash variant with manual redirect following'),
  textField('Normalization', 'Query and fragment removed from the page URL before building the variant'),
  textField('Selector', 'link[rel~="canonical" i]'),
  textField('Selection', 'First match in the variant response'),
  textField('Loop/cap criterion', 'Redirect loop or hop cap reached = error'),
  textField('Status criterion', '404 or 410 = info; 302 or 5xx = error; other non-200 = warning'),
  textField('Redirect criterion', 'Redirect to the original URL = info; to another URL = error'),
  textField('Canonical criterion', 'On 200: missing = warning; invalid = error; original URL = info; this variant = warning; other URL = error'),
]
type Markup = ReturnType<typeof variantCanonical>['markup']
type Facts = { type: Result['type']; priority: number; input: string; values: DisplayField[]; detailValues?: DisplayField[]; evidence?: EvidenceRecord[]; markup?: Markup; noMarkup?: string }

const normalize = (u: string) => { try { const url = new URL(u); url.hash = ''; return url.href } catch { return u } }
const buildVariant = (raw: string) => {
  const url = new URL(raw)
  url.search = ''; url.hash = ''
  const hasSlash = url.pathname.endsWith('/') && url.pathname.length > 1
  url.pathname = hasSlash ? url.pathname.replace(/\/$/, '') : `${url.pathname}/`
  const [withoutHash] = raw.split('#')
  const [clean] = (withoutHash || raw).split('?')
  return { originalUrl: new URL(clean || raw).toString(), variantUrl: url.toString(), hasSlash }
}
// Closed comparison verdicts (F2): the compared URL equals the current page URL, the variant itself, or neither.
const comparison = (url: string, originalUrl: string, variantUrl: string) => {
  if (normalize(url) === normalize(originalUrl)) return 'Equals current page URL'
  if (normalize(url) === normalize(variantUrl)) return 'Equals variant URL'
  return `Differs from current page URL (${differingComponent(url, originalUrl) ?? 'URL'})`
}

export const trailingSlashRule: Rule = {
  id: 'url:trailing-slash', name: NAME, presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'],
    description: 'Fetches the opposite trailing-slash variant and grades the outcome (redirect back = OK, canonical back = OK, 200 without canonical = warn, 404/410 = info).',
  },
  async run(page, ctx) {
    let originalUrl: string, variantUrl: string, hasSlash = false
    try { ({ originalUrl, variantUrl, hasSlash } = buildVariant(page.url)) } catch {
      return presentResult(trailingSlashRule, page, { type: 'runtime_error', priority: 50, input: 'Page URL', checked: CHECKED,
        values: [textField('Current page URL', 'Invalid URL')], noMarkup: 'None - the page URL could not be parsed; no variant was probed' })
    }
    const checked = [...CHECKED, textField('Variant', `URL ${hasSlash ? 'without' : 'with'} trailing slash`)]
    const build = (facts: Facts) => presentResult(trailingSlashRule, page, { checked, noMarkup: 'No response body was retrieved for this variant', ...facts })
    if (new URL(originalUrl).pathname === '/') {
      return build({ type: 'info', priority: 900, input: 'Page URL', values: [httpUrlField('Current page URL', originalUrl), textField('Path', 'Root (/)')], noMarkup: 'Not applicable - root path; no variant was probed' })
    }
    // Observed value first (the probed variant), then what it is compared to (the current page URL) (F1).
    const urls = [httpUrlField('Variant URL', variantUrl), httpUrlField('Current page URL', originalUrl)]
    const input = 'Page URL + Probed alternate URL response'

    try {
      const { chain, response } = await followRedirectChain(variantUrl, { wantBody: true, signal: ctx.signal })
      const status = chain.finalStatus
      const evidence = hopEvidence(chain.hops)
      const statusRow = textField(chain.redirected ? 'Final status' : 'Variant status', httpStatusLabel(status))
      const detailValues = [textField('Redirect hops', chain.hopsHidden ? 'Hidden by opaque redirect' : chain.redirectCount),
        ...(chain.note ? [textField('Probe note', chain.note)] : [])]
      const probed = { input, detailValues, evidence }

      if (chain.loop || chain.capped) {
        if (response) discardBody(response)
        return build({ ...probed, type: 'error', priority: 110, values: [...urls, statusRow, textField('Redirect chain', chain.loop ? 'Loop' : 'Hop cap reached')] })
      }
      if (status !== 200) {
        if (response) discardBody(response)
        const type = status === 404 || status === 410 ? 'info' : status === 302 || status >= 500 ? 'error' : 'warn'
        return build({ ...probed, type, priority: type === 'error' ? 150 : type === 'warn' ? 400 : 800, values: [...urls, statusRow] })
      }
      if (chain.redirected || chain.hopsHidden) {
        if (response) discardBody(response)
        const matchesOriginal = normalize(chain.finalUrl) === normalize(originalUrl)
        return build({ ...probed, type: matchesOriginal ? 'info' : 'error', priority: matchesOriginal ? 800 : 120,
          values: [...urls, statusRow, httpUrlField('Final URL', chain.finalUrl), textField('Comparison', comparison(chain.finalUrl, originalUrl, variantUrl))] })
      }
      if (!response) return build({ ...probed, type: 'runtime_error', priority: 10, values: [...urls, statusRow, textField('Response body', 'Absent')] })

      const body = await readResponseText(response, { signal: ctx.signal, maxBytes: HTML_RESPONSE_BYTES })
      const doc = parseHtmlDocument(body, page.doc)
      const capture = variantCanonical(doc, variantUrl)
      const canonicalHref = doc.querySelector('link[rel~="canonical" i]')?.getAttribute('href') || ''
      const withCanonical = { ...probed, evidence: [...evidence, ...capture.evidence], markup: capture.markup,
        noMarkup: canonicalHref ? 'Complete original variant canonical markup not retained' : 'No canonical link element found in the variant response' }

      if (!canonicalHref) return build({ ...withCanonical, type: 'warn', priority: 350, values: [...urls, statusRow, textField('Canonical link', 'Not found')] })
      let resolvedCanonical = ''
      try { resolvedCanonical = new URL(canonicalHref, variantUrl).href } catch {
        return build({ ...withCanonical, type: 'error', priority: 140,
          values: [...urls, statusRow, textField('Canonical href', canonicalHref), textField('Comparison', 'Not comparable, invalid URL'), ...capture.markup] })
      }
      const verdict = comparison(resolvedCanonical, originalUrl, variantUrl)
      const { type, priority } = verdict.startsWith('Equals current') ? { type: 'info' as const, priority: 850 }
        : verdict.startsWith('Equals variant') ? { type: 'warn' as const, priority: 300 } : { type: 'error' as const, priority: 130 }
      return build({ ...withCanonical, type, priority,
        values: [...urls, statusRow, ...(canonicalHref === resolvedCanonical ? [] : [textField('Canonical href', canonicalHref)]),
          httpUrlField('Canonical URL', resolvedCanonical), textField('Comparison', verdict), ...capture.markup] })
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      const hops = error instanceof RedirectChainError ? error.hops : []
      return build({ type: 'runtime_error', priority: 10, input: hops.length ? input : 'Page URL',
        values: [...urls, textField('Request', 'Failed'), textField('Error', probeError(msg))], evidence: hopEvidence(hops) })
    }
  },
}
