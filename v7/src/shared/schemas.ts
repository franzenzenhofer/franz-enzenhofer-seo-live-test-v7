import { z } from 'zod'

export const PageInfo = z.object({
  url: z.string().url(),
  title: z.string().default(''),
  description: z.string().default(''),
  canonical: z.string().url().optional(),
})

export type PageInfoT = z.infer<typeof PageInfo>

// Settings imported from disk are untrusted: only allow primitives + plain
// objects/arrays in known shapes. The settings import path filters by key
// whitelist; this schema asserts each value is a primitive or simple record
// so a hostile JSON file cannot smuggle exotic structures into chrome.storage.
const ImportableValue: z.ZodType<unknown> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(ImportableValue), z.record(ImportableValue)]),
)
export const ImportSettings = z.record(ImportableValue)
export type ImportSettingsT = z.infer<typeof ImportSettings>

// Subset of the Google PSI v5 response the extension actually reads. Anything
// past lighthouseResult.categories.performance.score is ignored, so we only
// guard the path we depend on instead of dragging in PSI's entire schema.
export const PSIResponse = z.object({
  lighthouseResult: z.object({
    categories: z.object({
      performance: z.object({ score: z.number().nullable().optional() }).passthrough(),
    }).passthrough().optional(),
    audits: z.record(z.object({
      score: z.number().nullable().optional(),
      numericValue: z.number().optional(),
      displayValue: z.string().optional(),
    }).passthrough()).optional(),
  }).passthrough().optional(),
  loadingExperience: z.unknown().optional(),
}).passthrough()
export type PSIResponseT = z.infer<typeof PSIResponse>
