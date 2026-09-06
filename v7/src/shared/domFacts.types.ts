import type { contentSummary } from './contentText'
import type { SeoPhaseSignals } from './seoPhaseSignals'

export type FactBucket = 'head' | 'anchor' | 'resource'

export type DomPhase = 'static' | 'idle'

export type DomElementFact = {
  location: 'head' | 'body'
  tag: string
  attrs: Array<[string, string]>
  text?: string
}

export type ScanBudget = { general: number; anchor: number }

export type DomScan = {
  elements: DomElementFact[]
  truncatedBuckets: FactBucket[]
  criticalTruncated: boolean
  elementsTruncated: boolean
  nodeCount: number
  maxDepth: number
  anchorCount: number
  scriptCount: number
  blockingScriptCount: number
  parameterizedLinks: string[]
  parameterizedLinkCount: number
}

export type DomPhaseFacts = {
  phase: DomPhase
  nodeCount: number
  maxDepth: number
  textLength: number
  scriptCount: number
  blockingScriptCount: number
  anchorCount: number
  parameterizedLinkCount: number
  parameterizedLinks: string[]
  parameterizedLinksTruncated: boolean
  elements: DomElementFact[]
  elementsTruncated: boolean
  truncatedBuckets: FactBucket[]
  criticalTruncated: boolean
  documentAttributes: Array<[string, string]>
  baseUri?: string
  content?: ReturnType<typeof contentSummary>
  seoSignals?: SeoPhaseSignals
  internalLinkCandidates?: Array<{ url: string; domPath: string }>
  internalLinkCount?: number
  internalLinkCandidatesOmitted?: number
}
