import { urlOrText } from '../failureReason'

import type { inspectionDetails } from './inspectionData'

import { textField } from '@/shared/presentation/create'
import type { DisplayField, EvidenceRecord } from '@/shared/presentation/schema'

type Details = ReturnType<typeof inspectionDetails>

// Google's recorded states as labelled facts; a URL Google reported is a link, a missing field is Not found.
export const urlInspectionDetailValues = (details: Details): DisplayField[] => [
  details.googleCanonical ? urlOrText('Google canonical', details.googleCanonical) : textField('Google canonical', 'Not found'),
  details.userCanonical ? urlOrText('User canonical', details.userCanonical) : textField('User canonical', 'Not found'),
  textField('Robots.txt state', details.robotsTxtState),
  textField('Indexing state', details.indexingState),
  textField('Page fetch state', details.pageFetchState),
  textField('Crawled as', details.crawledAs),
  textField('Rich results verdict', details.richResults ? details.richResults.verdict : 'Not found'),
]

// One record per referring URL, sitemap and rich result type (FORMATTING.md F7); the storage bound caps the lists.
export const urlInspectionEvidence = (details: Details, referringUrls: string[]): EvidenceRecord[] => [
  ...referringUrls.map((url, i) => ({ name: `Referring URL ${i + 1}`, fields: [urlOrText('URL', url)] })),
  ...(details.sitemaps || []).map((url, i) => ({ name: `Sitemap ${i + 1}`, fields: [urlOrText('URL', url)] })),
  ...(details.richResults?.detectedItems || []).map((group, i) => ({ name: `Rich result type ${i + 1}`, fields: [
    textField('Type', group.richResultType || 'Not found'),
    textField('Items', group.itemCount ?? 0),
    textField('Total issues', group.items?.reduce((sum, item) => sum + (item.issueCount || 0), 0) || 0),
  ] })),
]
