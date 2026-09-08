import { gscFetch } from '../googleFetch'
import { extractGoogleCredentials, createNoTokenResult } from '../google-utils'
import { deriveGscProperty, createGscPropertyDerivationFailedResult } from '../google-gsc-utils'

import { inspectionResponse, inspectionDetails } from './inspectionData'
import { inspectionValue, relativeTime } from './gscValue'

import type { Rule } from '@/core/types'

const NAME = 'GSC URL Inspection'
const LABEL = 'GSC'

export const gscUrlInspectionRule: Rule = {
  id: 'gsc:url-inspection',
  name: NAME,
  enabled: true,
  what: 'gsc',
  timeout: { mode: 'api' },
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect',
    ],
    description: 'Calls the Search Console URL Inspection API and reports coverageState/verdict/lastCrawlTime/referringUrls (ok on PASS, warn otherwise).',
  },
  async run(page, ctx) {
    const { token } = extractGoogleCredentials(ctx)
    if (!token) return createNoTokenResult(LABEL, NAME)

    const derived = await deriveGscProperty(page.url, token)
    if (!derived) return createGscPropertyDerivationFailedResult(page.url)

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
      return {
        label: LABEL,
        message: `URL Inspection API request failed: ${message}`,
        type: 'runtime_error',
        name: NAME,
        priority: -1000,
        details: { property: derived.property, propertyType: derived.type },
      }
    }

    if (!response.ok) {
      return {
        label: LABEL,
        message: `URL Inspection API error ${response.status}`,
        type: 'warn',
        name: NAME,
        priority: 0,
        details: { property: derived.property, propertyType: derived.type, status: response.status },
      }
    }

    const parsed = inspectionResponse.safeParse(await response.json())
    if (!parsed.success) return { label: LABEL, name: NAME, type: 'runtime_error', priority: 0, message: 'URL Inspection response was malformed.' }
    const data = parsed.data

    const indexStatus = data.inspectionResult?.indexStatusResult
    if (!indexStatus) {
      return {
        label: LABEL,
        message: 'URL Inspection API delivered no results.',
        type: 'runtime_error',
        name: NAME,
        priority: -500,
        details: { property: derived.property, propertyType: derived.type },
      }
    }

    const verdict = indexStatus.verdict || 'UNKNOWN'
    const coverage = indexStatus.coverageState || 'Unknown coverage'
    const referringUrls = indexStatus.referringUrls || []
    const lastCrawl = indexStatus.lastCrawlTime || null
    const crawlText = lastCrawl ? ` Last crawled ${relativeTime(lastCrawl)}.` : ''
    const refText = referringUrls.length
      ? ` Referrer: ${referringUrls[0]}${referringUrls.length > 1 ? ` (+${referringUrls.length - 1} more)` : ''}.`
      : ' No referring pages reported.'
    const isPass = verdict === 'PASS'

    return {
      label: LABEL,
      message: `${data.inspectionResult?.inspectionResultLink ? 'GSC URL Inspection' : 'URL Inspection'}: ${coverage} (verdict ${verdict}).${crawlText}${refText}`,
      type: isPass ? 'ok' : 'warn',
      name: NAME,
      priority: isPass ? 700 : 120,
      details: {
        value: inspectionValue(coverage, verdict, lastCrawl),
        property: derived.property,
        propertyType: derived.type,
        verdict,
        coverageState: coverage,
        referringUrls,
        lastCrawlTime: lastCrawl,
        inspectionResultLink: data.inspectionResult?.inspectionResultLink || null,
        ...inspectionDetails(data.inspectionResult!),
      },
    }
  },
}
