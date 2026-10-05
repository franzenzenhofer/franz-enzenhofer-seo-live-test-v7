import { gscFetch } from '../googleFetch'
import { extractGoogleCredentials } from '../google-utils'
import { deriveGscProperty } from '../google-gsc-utils'

import { inspectionResponse, inspectionDetails } from './inspectionData'
import { inspectionLabel } from './inspectionLabels'
import { gscNoTokenFacts, gscPropertyMissingFacts, gscApiIssueFacts, gscNetworkErrorFacts, propertyFields, GSC_API_INPUT, GSC_NOT_MARKUP } from './gscFacts'
import { urlInspectionDetailValues, urlInspectionEvidence } from './urlInspectionEvidence'

import { textField, urlField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'

const NAME = 'GSC URL Inspection'
const API = 'Search Console urlInspection.index:inspect'

export const gscUrlInspectionRule: Rule = {
  id: 'gsc:url-inspection',
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'gsc',
  timeout: { mode: 'api' },
  meta: {
    userGuide: {
      check: "Shows Google's recorded inspection of this URL, including indexing, last crawl, the declared preferred URL and Google's selected URL. It does not inspect the live page you are viewing.",
      action: "Open the linked Search Console inspection. Check whether the reported exclusion or canonical choice is intentional; if not, fix the named crawl/indexing issue on the website, then request a new inspection in Search Console.",
    },
    provenance: 'google',
    references: [
      'https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect',
    ],
    description: 'Calls the Search Console URL Inspection API and reports coverageState/verdict/lastCrawlTime/referringUrls (ok on PASS, warn otherwise).',
  },
  async run(page, ctx) {
    const { token } = extractGoogleCredentials(ctx)
    if (!token) return presentResult(gscUrlInspectionRule, page, gscNoTokenFacts())

    const derived = await deriveGscProperty(page.url, token)
    if (!derived) return presentResult(gscUrlInspectionRule, page, gscPropertyMissingFacts(page.url))

    const body = { inspectionUrl: page.url, siteUrl: derived.property, languageCode: 'en-US' }
    let response: Response
    try {
      response = await gscFetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return presentResult(gscUrlInspectionRule, page, gscNetworkErrorFacts(API, message, derived.property, derived.type))
    }

    if (!response.ok) return presentResult(gscUrlInspectionRule, page, gscApiIssueFacts(API, response.status, derived.property, derived.type))

    const parsed = inspectionResponse.safeParse(await response.json())
    if (!parsed.success) {
      return presentResult(gscUrlInspectionRule, page, {
        input: GSC_API_INPUT,
        type: 'runtime_error',
        priority: 0,
        values: [textField('GSC response', 'Malformed')],
        detailValues: propertyFields(derived.property, derived.type),
        checked: [textField('API', API)],
        noMarkup: GSC_NOT_MARKUP,
      })
    }

    const indexStatus = parsed.data.inspectionResult?.indexStatusResult
    if (!indexStatus) {
      return presentResult(gscUrlInspectionRule, page, {
        input: GSC_API_INPUT,
        type: 'runtime_error',
        priority: -500,
        values: [textField('Index status', 'Not found')],
        detailValues: propertyFields(derived.property, derived.type),
        checked: [textField('API', API)],
        noMarkup: GSC_NOT_MARKUP,
      })
    }

    const verdict = indexStatus.verdict || 'UNKNOWN'
    const coverage = indexStatus.coverageState || 'Not found'
    const referringUrls = indexStatus.referringUrls || []
    const lastCrawl = indexStatus.lastCrawlTime || null
    const isPass = verdict === 'PASS'
    const details = inspectionDetails(parsed.data.inspectionResult!)
    const inspectionResultLink = parsed.data.inspectionResult?.inspectionResultLink

    return presentResult(gscUrlInspectionRule, page, {
      input: GSC_API_INPUT,
      type: isPass ? 'ok' : verdict === 'FAIL' ? 'warn' : 'info',
      priority: isPass ? 700 : 120,
      values: [
        textField('Coverage state', coverage),
        textField('Verdict', inspectionLabel(verdict)),
        textField('Last crawl', lastCrawl || 'Not found'),
      ],
      detailValues: [
        ...propertyFields(derived.property, derived.type),
        ...(inspectionResultLink ? [urlField('Inspection result link', inspectionResultLink)] : []),
        ...urlInspectionDetailValues(details),
      ],
      checked: [textField('API', API), textField('Criterion', 'Verdict PASS passes; verdict FAIL warns; any other verdict is an observation')],
      evidence: urlInspectionEvidence(details, referringUrls),
      noMarkup: GSC_NOT_MARKUP,
    })
  },
}
