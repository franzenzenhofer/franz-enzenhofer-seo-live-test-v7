import { extractGoogleCredentials, createNoTokenResult } from '../google-utils'
import { deriveGscProperty, createGscPropertyDerivationFailedResult } from '../google-gsc-utils'

import type { Rule } from '@/core/types'

const NAME = 'GSC URL Inspection'
const SPEC = 'https://developers.google.com/search/apis/indexing-api/v1/url-inspection'
const LABEL = 'GSC'

const relativeTime = (iso?: string | null) => {
  if (!iso) return ''
  const ts = new Date(iso).getTime()
  if (Number.isNaN(ts)) return ''
  const elapsed = Date.now() - ts
  const mins = Math.floor(elapsed / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 48) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 60) return `${days} day${days === 1 ? '' : 's'} ago`
  const months = Math.floor(days / 30)
  if (months < 24) return `${months} month${months === 1 ? '' : 's'} ago`
  const years = Math.floor(months / 12)
  return `${years} year${years === 1 ? '' : 's'} ago`
}

export const gscUrlInspectionRule: Rule = {
  id: 'gsc:url-inspection',
  name: NAME,
  enabled: true,
  what: 'gsc',
  timeout: { mode: 'api' },
  async run(page, ctx) {
    const { token } = extractGoogleCredentials(ctx)
    if (!token) return createNoTokenResult(LABEL, NAME)

    const derived = await deriveGscProperty(page.url, token)
    if (!derived) return createGscPropertyDerivationFailedResult(page.url)

    const body = { inspectionUrl: page.url, siteUrl: derived.property, languageCode: 'en-US' }
    let response: Response
    try {
      response = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
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
        details: { property: derived.property, propertyType: derived.type, reference: SPEC },
      }
    }

    if (!response.ok) {
      return {
        label: LABEL,
        message: `URL Inspection API error ${response.status}`,
        type: 'warn',
        name: NAME,
        priority: 0,
        details: { property: derived.property, propertyType: derived.type, status: response.status, reference: SPEC },
      }
    }

    const data = await response.json() as {
      inspectionResult?: {
        inspectionResultLink?: string
        indexStatusResult?: { verdict?: string; coverageState?: string; referringUrls?: string[]; lastCrawlTime?: string }
      }
    }

    const indexStatus = data.inspectionResult?.indexStatusResult
    if (!indexStatus) {
      return {
        label: LABEL,
        message: 'URL Inspection API delivered no results.',
        type: 'runtime_error',
        name: NAME,
        priority: -500,
        details: { property: derived.property, propertyType: derived.type, reference: SPEC },
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
        property: derived.property,
        propertyType: derived.type,
        verdict,
        coverageState: coverage,
        referringUrls,
        lastCrawlTime: lastCrawl,
        inspectionResultLink: data.inspectionResult?.inspectionResultLink || null,
        reference: SPEC,
      },
    }
  },
}
