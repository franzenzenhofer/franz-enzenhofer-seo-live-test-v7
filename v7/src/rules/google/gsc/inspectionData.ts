import { z } from 'zod'

import { inspectionLabel } from './inspectionLabels'

const text = z.string().optional()
export const inspectionResponse = z.object({
  inspectionResult: z.object({
    inspectionResultLink: text,
    indexStatusResult: z.object({ verdict: text, coverageState: text, lastCrawlTime: text,
      referringUrls: z.array(z.string()).optional(), sitemap: z.array(z.string()).optional(),
      googleCanonical: text, userCanonical: text, robotsTxtState: text, indexingState: text,
      pageFetchState: text, crawledAs: text }).optional(),
    richResultsResult: z.object({ verdict: text, detectedItems: z.array(z.object({
      richResultType: text, items: z.array(z.object({ name: text, issues: z.array(z.object({
        issueMessage: text, severity: text,
      })).optional() })).optional(),
    })).optional() }).optional(),
  }).optional(),
})

type Inspection = NonNullable<z.infer<typeof inspectionResponse>['inspectionResult']>
export const inspectionDetails = (inspection: Inspection) => {
  const status = inspection.indexStatusResult
  const rich = inspection.richResultsResult
  return {
    googleCanonical: status?.googleCanonical, userCanonical: status?.userCanonical,
    canonicalMismatch: status?.googleCanonical && status.userCanonical ? status.googleCanonical !== status.userCanonical : undefined,
    robotsTxtState: inspectionLabel(status?.robotsTxtState), indexingState: inspectionLabel(status?.indexingState),
    pageFetchState: inspectionLabel(status?.pageFetchState), crawledAs: inspectionLabel(status?.crawledAs),
    sitemaps: status?.sitemap, sitemapCount: status?.sitemap?.length,
    richResults: rich ? { verdict: inspectionLabel(rich.verdict), detectedTypeCount: rich.detectedItems?.length,
      detectedItems: rich.detectedItems?.map((group) => ({ richResultType: group.richResultType,
        itemCount: group.items?.length, items: group.items?.map((item) => ({ name: item.name,
          issueCount: item.issues?.length, issues: item.issues })) })) } : undefined,
    evidenceSource: 'Google indexed-version inspection; fields describe Google\'s recorded crawl, not this live navigation. Missing fields are unavailable, not passes.',
  }
}
