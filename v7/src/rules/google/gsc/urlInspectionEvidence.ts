import type { inspectionDetails } from './inspectionData'

import { textField, urlField } from '@/shared/presentation/create'
import type { DisplayField } from '@/shared/presentation/schema'

const LIMIT = 10
const bounded = <T>(items: T[]) => ({
  sample: items.slice(0, LIMIT),
  retained: Math.min(items.length, LIMIT),
  omitted: Math.max(items.length - LIMIT, 0),
})

type Details = ReturnType<typeof inspectionDetails>

export const urlInspectionDetailValues = (details: Details): DisplayField[] => [
  textField('Google canonical', details.googleCanonical || 'Not reported by Google'),
  textField('User canonical', details.userCanonical || 'Not reported by Google'),
  textField('Canonical mismatch', details.canonicalMismatch === undefined ? 'Not determined' : details.canonicalMismatch ? 'Yes' : 'No'),
  textField('Robots.txt state', details.robotsTxtState),
  textField('Indexing state', details.indexingState),
  textField('Page fetch state', details.pageFetchState),
  textField('Crawled as', details.crawledAs),
  textField('Rich results verdict', details.richResults ? details.richResults.verdict : 'Not evaluated'),
]

export const urlInspectionEvidence = (details: Details, referringUrls: string[]): Array<{ name: string; fields: DisplayField[] }> => {
  const evidence: Array<{ name: string; fields: DisplayField[] }> = []
  if (referringUrls.length) {
    const { sample, retained, omitted } = bounded(referringUrls)
    evidence.push({ name: 'Referring URLs', fields: [
      ...sample.map((url, i) => urlField(`URL ${i + 1}`, url)),
      textField('Retained', retained), textField('Omitted', omitted),
    ] })
  }
  if (details.sitemaps?.length) {
    const { sample, retained, omitted } = bounded(details.sitemaps)
    evidence.push({ name: 'Sitemaps', fields: [
      ...sample.map((url, i) => urlField(`Sitemap ${i + 1}`, url)),
      textField('Retained', retained), textField('Omitted', omitted),
    ] })
  }
  details.richResults?.detectedItems?.forEach((group, i) => {
    const issues = group.items?.reduce((sum, item) => sum + (item.issueCount || 0), 0) || 0
    evidence.push({ name: `Rich result type ${i + 1}`, fields: [
      textField('Type', group.richResultType || 'Unknown'),
      textField('Items', group.itemCount ?? 0),
      textField('Total issues', issues),
    ] })
  })
  return evidence
}
