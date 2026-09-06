import { z } from 'zod'

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
    robotsTxtState: status?.robotsTxtState, indexingState: status?.indexingState,
    pageFetchState: status?.pageFetchState, crawledAs: status?.crawledAs,
    sitemaps: status?.sitemap?.slice(0, 10), sitemapCount: status?.sitemap?.length,
    richResults: rich ? { verdict: rich.verdict, detectedTypeCount: rich.detectedItems?.length,
      detectedItems: rich.detectedItems?.slice(0, 10).map((group) => ({ richResultType: group.richResultType,
        itemCount: group.items?.length, items: group.items?.slice(0, 10).map((item) => ({ name: item.name,
          issueCount: item.issues?.length, issues: item.issues?.slice(0, 10) })) })) } : undefined,
    evidenceSource: 'Google indexed-version inspection; fields describe Google\'s recorded crawl, not this live navigation. Missing fields are unavailable, not passes.',
  }
}
