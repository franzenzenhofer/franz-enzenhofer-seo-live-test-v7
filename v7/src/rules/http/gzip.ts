import {
  codingName, encodingEvidence, fetchHeadHeaders, headerSourceLabel,
  isHtmlLike, KNOWN_ENCODINGS, normalizeHeaders, parseEncodings,
} from './gzip.evidence'
import { headersNotCapturedResult } from './headersNotCaptured'
import { HEADER_NO_MARKUP, headerEvidence, headerRow } from './observedHeader'

import { hasHeaders } from '@/shared/http-utils'
import { normalizeUrl } from '@/shared/url-utils'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'
import { listRow } from '@/shared/presentation/listRow'

const NAME = 'Gzip/Brotli Compression'
const RULE_ID = 'http:gzip'
const ACCEPTED_CODINGS = 'br, gzip, zstd, deflate'

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
    if (!hasHeaders(headers)) return headersNotCapturedResult(gzipRule, page, 'Content-Encoding')

    const encodingHeader = headers['content-encoding'] || ''
    const encodings = parseEncodings(encodingHeader)
    const hasAccepted = encodings.some((e) => KNOWN_ENCODINGS[e]?.accepted === true)
    const checked = [
      textField('Header name', 'Content-Encoding'),
      textField('Header source', headerSourceLabel(headerSource)),
      textField('Accepted codings', ACCEPTED_CODINGS),
    ]
    const values = [headerRow('Content-Encoding', encodingHeader), ...(encodings.length ? [textField('Codings', listRow(encodings.map(codingName)))] : [])]
    const evidence = [...headerEvidence('Content-Encoding', encodingHeader), ...encodingEvidence(encodings)]
    const passed = encodings.length > 0 && hasAccepted
    return presentResult(gzipRule, page, {
      input: 'HTTP response headers', type: passed ? 'ok' : 'warn', priority: passed ? 800 : 150,
      values, checked, evidence, noMarkup: HEADER_NO_MARKUP,
    })
  },
}
