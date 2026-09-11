import { hopEvidence, variantCanonicalMarkup } from './trailingSlash.evidence'

import type { Rule, Result } from '@/core/types'
import { httpUrlField } from '@/rules/http/navigationStepEvidence'
import { discardBody } from '@/shared/http-utils'
import { httpStatusLabel } from '@/shared/httpStatusLabel'
import { parseHtmlDocument } from '@/shared/parseHtml'
import { followRedirectChain } from '@/shared/redirectChain'
import { RedirectChainError } from '@/shared/redirectChainTypes'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { DisplayField } from '@/shared/presentation/schema'
import { HTML_RESPONSE_BYTES, readResponseText } from '@/shared/responseBody'

const NAME = 'URL trailing slash consistency'
const CHECKED = [
  textField('Probe', 'Fetch the opposite trailing-slash variant with manual redirect following'),
  textField('Selector', 'link[rel~="canonical" i]'),
  textField('Selection', 'First match in the variant response'),
  textField('Loop/cap criterion', 'Redirect loop or hop cap reached = error'),
  textField('Status criterion', '404 or 410 = info; 302 or 5xx = error; other non-200 = warning'),
  textField('Redirect criterion', 'Redirect to the original URL = info; to another URL = error'),
  textField('Canonical criterion', 'On 200: missing = warning; invalid = error; original URL = info; this variant = warning; other URL = error'),
]

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

export const trailingSlashRule: Rule = {
  id: 'url:trailing-slash', name: NAME, presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'],
    description: 'Fetches the opposite trailing-slash variant and grades the outcome (redirect back = OK, canonical back = OK, 200 without canonical = warn, 404/410 = info).',
  },
  async run(page, ctx) {
    const build = (type: Result['type'], priority: number, input: string, values: DisplayField[], detailValues: DisplayField[] = [], evidence: ReturnType<typeof hopEvidence> = [], markup: ReturnType<typeof variantCanonicalMarkup>['markup'] = [], noMarkup = 'No response body was retrieved for this variant') =>
      presentResult(trailingSlashRule, page, { input, type, priority, checked: CHECKED, values, detailValues, evidence, markup, noMarkup })

    let originalUrl: string, variantUrl: string, hasSlash = false
    try { ({ originalUrl, variantUrl, hasSlash } = buildVariant(page.url)) } catch {
      return build('runtime_error', 50, 'Page URL', [textField('Page URL valid', 'No')], [], [], [], 'None - the page URL could not be parsed; no variant was probed')
    }
    if (new URL(originalUrl).pathname === '/') {
      return build('info', 900, 'Page URL', [httpUrlField('Original URL', originalUrl), textField('Path', 'Root (/)')], [], [], [], 'Not applicable - root path; no variant was probed')
    }

    const whatCase = hasSlash ? 'without' : 'with'
    const opposite = hasSlash ? 'with' : 'without'
    const variantFacts = [textField('Checked variant', `URL ${whatCase} trailing slash`), textField('Original version', `URL ${opposite} trailing slash`)]
    const urls = [httpUrlField('Original URL', originalUrl), httpUrlField('Variant URL', variantUrl)]
    const input = 'Page URL + Probed alternate URL response'

    try {
      const { chain, response } = await followRedirectChain(variantUrl, { wantBody: true, signal: ctx.signal })
      const status = chain.finalStatus
      const finalUrl = chain.finalUrl
      const redirected = chain.redirected
      const evidence = hopEvidence(chain.hops)
      const detail = [...urls, httpUrlField('Final URL', finalUrl), textField('Redirect hop count', chain.hopsHidden ? 'Not visible (opaque redirect)' : chain.redirectCount),
        ...(chain.note ? [textField('Probe note', chain.note)] : [])]

      if (chain.loop || chain.capped) {
        if (response) discardBody(response)
        return build('error', 110, input, [...variantFacts, textField('Redirect loop detected', chain.loop ? 'Yes' : 'No'), textField('Hop cap reached', chain.capped ? 'Yes' : 'No')], detail, evidence)
      }
      if (status !== 200) {
        if (response) discardBody(response)
        const type = status === 404 || status === 410 ? 'info' : status === 302 || status >= 500 ? 'error' : 'warn'
        return build(type, type === 'error' ? 150 : type === 'warn' ? 400 : 800,
          input, [...variantFacts, textField('Variant response status', httpStatusLabel(status))], detail, evidence)
      }
      if (redirected || chain.hopsHidden) {
        if (response) discardBody(response)
        const matchesOriginal = normalize(finalUrl) === normalize(originalUrl)
        return build(matchesOriginal ? 'info' : 'error', matchesOriginal ? 800 : 120, input,
          [...variantFacts, textField('Variant response status', httpStatusLabel(status)), textField('Redirect target', matchesOriginal ? 'Original version' : 'Unexpected URL')],
          detail, evidence)
      }
      if (!response) {
        return build('runtime_error', 10, input, [...variantFacts, textField('Response body available', 'No')], detail, evidence)
      }

      const body = await readResponseText(response, { signal: ctx.signal, maxBytes: HTML_RESPONSE_BYTES })
      const doc = parseHtmlDocument(body, page.doc)
      const capture = variantCanonicalMarkup(doc)
      const canonicalHref = doc.querySelector('link[rel~="canonical" i]')?.getAttribute('href') || ''
      const noMarkup = canonicalHref ? 'Complete original variant canonical markup not retained' : 'No canonical link element found in the variant response'

      if (!canonicalHref) {
        return build('warn', 350, input, [...variantFacts, textField('Variant response status', httpStatusLabel(status)), textField('Canonical declared', 'No')], detail, evidence, capture.markup, noMarkup)
      }
      let resolvedCanonical = ''
      try { resolvedCanonical = new URL(canonicalHref, variantUrl).href } catch {
        return build('error', 140, input, [...variantFacts, textField('Canonical declared', 'Yes'), textField('Canonical href valid', 'No')],
          [...detail, textField('Declared canonical href', canonicalHref)], evidence, capture.markup, noMarkup)
      }

      const matchesOriginal = normalize(resolvedCanonical) === normalize(originalUrl)
      const matchesVariant = normalize(resolvedCanonical) === normalize(variantUrl)
      const canonicalDetail = [...detail, httpUrlField('Resolved canonical URL', resolvedCanonical)]
      if (!matchesOriginal && !matchesVariant) {
        return build('error', 130, input, [...variantFacts, textField('Canonical target', 'Neither original nor variant')], canonicalDetail, evidence, capture.markup, noMarkup)
      }
      if (matchesOriginal) {
        return build('info', 850, input, [...variantFacts, textField('Canonical target', 'Original version')], canonicalDetail, evidence, capture.markup, noMarkup)
      }
      return build('warn', 300, input, [...variantFacts, textField('Canonical target', 'This variant (self-referential)')], canonicalDetail, evidence, capture.markup, noMarkup)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      const hops = error instanceof RedirectChainError ? error.hops : []
      return build('runtime_error', 10, hops.length ? input : 'Page URL', [...variantFacts, textField('Probe failed', msg)], urls, hopEvidence(hops))
    }
  },
}
