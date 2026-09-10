import { gscFetch } from '../googleFetch'
import { extractGoogleCredentials, createNoTokenResult } from '../google-utils'
import { deriveGscProperty, createGscPropertyDerivationFailedResult } from '../google-gsc-utils'

import { searchAnalyticsValue } from './gscValue'
import { searchAnalyticsPeriod, searchAnalyticsScope, gscRequestIssue } from './searchAnalyticsContext'

import type { Rule } from '@/core/types'

const NAME = 'Page worldwide analytics'

export const gscPageWorldwideRule: Rule = {
  id: 'gsc:page-worldwide',
  name: NAME,
  enabled: true,
  what: 'gsc',
  meta: {
    userGuide: {
      check: "Reports clicks and impressions for the exact page URL over the displayed 90-day period, across all countries and devices. These are Google web search figures, not all website visits.",
      action: "Compare the same page and dates in Search Console. If figures are missing, check the canonical URL and available reporting dates before changing the website.",
    },
    provenance: 'franz',
    references: [
      'https://developers.google.com/webmaster-tools/v1/searchanalytics/query',
    ],
    description: 'Reports worldwide Search Analytics impressions and clicks for the tested page URL as an info result.',
  },
  async run(page, ctx) {
    const { token } = extractGoogleCredentials(ctx)
    if (!token) return createNoTokenResult('GSC', NAME)

    const derived = await deriveGscProperty(page.url, token)
    if (!derived) return createGscPropertyDerivationFailedResult(page.url, NAME)

    const { property, type: propertyType } = derived
    const period = searchAnalyticsPeriod()
    const body = { ...period, type: 'web', dataState: 'final', dimensions: ['page'], dimensionFilterGroups: [{ groupType: 'and', filters: [{ dimension: 'page', operator: 'equals', expression: page.url }] }] }
    try {
      const r = await gscFetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) })
      if (!r.ok) return gscRequestIssue(r.status, NAME, page.url, property)
      const j = await r.json() as { rows?: Array<{ clicks?: number, impressions?: number, keys?: string[] }> }
      const row = (j.rows || []).find(r => (r.keys||[])[0] === page.url)
      const imp = row?.impressions || 0
      const cl = row?.clicks || 0
      return {
        label: 'GSC',
        message: `Impressions ${imp}, Clicks ${cl}`,
        type: 'info',
        priority: 750,
        name: NAME,
        details: { url: page.url, value: searchAnalyticsValue(imp, cl), property, propertyType, impressions: imp, clicks: cl, ...searchAnalyticsScope(period), apiResponse: j },
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        label: 'GSC',
        message: `GSC request failed: ${message}`,
        type: 'runtime_error',
        name: NAME,
        priority: -1000,
        details: { url: page.url, property, propertyType },
      }
    }
  },
}
