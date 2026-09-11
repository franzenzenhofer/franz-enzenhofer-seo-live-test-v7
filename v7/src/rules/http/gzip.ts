import {
  encodingEvidence, fetchHeadHeaders, headerRecord, headerSourceLabel,
  isHtmlLike, KNOWN_ENCODINGS, normalizeHeaders, parseEncodings,
} from './gzip.evidence'

import { hasHeaders } from '@/shared/http-utils'
import { normalizeUrl } from '@/shared/url-utils'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'

const NAME = 'Gzip/Brotli Compression'
const RULE_ID = 'http:gzip'
const ACCEPTED_CODINGS = 'br, gzip, zstd, deflate'
const NO_MARKUP = 'None - this rule checks the HTTP response, not document markup'

export const gzipRule: Rule = {
  id: RULE_ID,
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'http',
  meta: {
    userGuide: {
      check: "Reads Content-Encoding for the main document to identify response compression. Compression reduces transferred text bytes; this check does not measure the savings or validate every resource. Header source identifies whether the evidence was captured or re-probed.",
      action: "Enable an appropriate supported text-compression format in the server or CDN and verify the response’s Content-Encoding. Avoid recompressing formats already compressed, and review the listed encoding if it is unknown or obsolete.",
    },
    provenance: 'google',
    references: [
      'https://developer.chrome.com/docs/lighthouse/performance/uses-text-compression',
      'https://www.iana.org/assignments/http-parameters/http-parameters.xhtml#content-coding',
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Encoding',
      'https://caniuse.com/zstd',
    ],
    description: "Checks the main document's Content-Encoding header, passing on gzip/br/zstd/deflate, warning when absent or when only an obsolete coding is used (with a HEAD re-probe when captured headers look like an asset).",
  },
  async run(page, ctx) {
    let headers = normalizeHeaders(page.headers)
    const docIsHtml = page.doc?.documentElement?.nodeName?.toLowerCase() === 'html'
    const chainLastUrl = page.headerChain?.[page.headerChain.length - 1]?.url
    const chainMismatch = chainLastUrl ? normalizeUrl(chainLastUrl) !== normalizeUrl(page.url) : false
    const hasEncodingHeader = !!headers['content-encoding']
    // headerSource 'probe' means page.headers already came from a live HEAD of
    // page.url this run - probing again would repeat the identical request.
    const shouldProbe = hasHeaders(headers) && !hasEncodingHeader && docIsHtml &&
      (!isHtmlLike(headers) || chainMismatch) && page.headerSource !== 'probe'
    let headerSource: 'captured' | 'probe' = 'captured'

    if (shouldProbe) {
      const probed = await fetchHeadHeaders(page.url, ctx.signal)
      if (hasHeaders(probed)) {
        headers = normalizeHeaders(probed)
        headerSource = 'probe'
      }
    }
    if (!hasHeaders(headers)) {
      return presentResult(gzipRule, page, {
        input: 'Not captured', type: 'runtime_error', priority: 50,
        values: [textField('Header capture', 'Not captured')],
        checked: [textField('Header name', 'Content-Encoding'), textField('Capture requirement', 'Response headers must be captured or re-probed')],
        noMarkup: NO_MARKUP,
      })
    }

    const encodingHeader = headers['content-encoding'] || ''
    const encodings = parseEncodings(encodingHeader)
    const hasAccepted = encodings.some((e) => KNOWN_ENCODINGS[e]?.accepted === true)
    const checked = [
      textField('Header name', 'Content-Encoding'),
      textField('Header source', headerSourceLabel(headerSource)),
      textField('Accepted codings', ACCEPTED_CODINGS),
    ]
    const evidence = [headerRecord(headers), ...(encodings.length ? encodingEvidence(encodings) : [])]

    if (!encodings.length) {
      return presentResult(gzipRule, page, {
        input: 'HTTP response headers', type: 'warn', priority: 150,
        values: [textField('Content-Encoding', 'Not present'), textField('Compression', 'Not detected'), textField('Header source', headerSource)],
        checked, evidence, noMarkup: NO_MARKUP,
      })
    }
    if (hasAccepted) {
      return presentResult(gzipRule, page, {
        input: 'HTTP response headers', type: 'ok', priority: 800,
        values: [textField('Content-Encoding', encodingHeader), textField('Compression', 'Supported coding detected'), textField('Header source', headerSource)],
        detailValues: [textField('Encoding tokens', encodings.length)],
        checked, evidence, noMarkup: NO_MARKUP,
      })
    }
    return presentResult(gzipRule, page, {
      input: 'HTTP response headers', type: 'warn', priority: 150,
      values: [textField('Content-Encoding', encodingHeader), textField('Compression', 'Unsupported coding only'), textField('Header source', headerSource)],
      detailValues: [textField('Encoding tokens', encodings.length)],
      checked, evidence, noMarkup: NO_MARKUP,
    })
  },
}
