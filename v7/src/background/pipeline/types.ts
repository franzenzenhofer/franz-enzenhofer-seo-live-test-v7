import type { ResourceFact } from '@/shared/resourceFacts'

export type EventRec = {
  documentId?: string
  /** webRequest frame identity (0 = main frame); see storeFrames.resourceScope. */
  frameId?: number
  parentFrameId?: number
  parentDocumentId?: string
  t: string
  u?: string
  h?: Record<string, string | undefined>
  headerFields?: Array<[string, string]>
  requestId?: string
  resourceType?: string
  error?: string
  s?: number
  sc?: number
  sl?: string
  c?: boolean
  ip?: string
  ru?: string
  d?: unknown
}
/**
 * Bounded record of the subresources a page loaded. Every number means exactly
 * one thing, so no rule can mistake lifecycle callbacks for resources:
 * - events: webRequest callbacks observed (several per request)
 * - completed / errors: terminal observations
 * - facts: distinct resource URLs RETAINED as evidence (bounded)
 * - droppedObservations: terminal observations whose URL did not fit
 * The real number of distinct URLs is unknown once `truncated` is true.
 */
export type ResourceLedger = {
  events: number
  completed: number
  errors: number
  facts: ResourceFact[]
  droppedObservations: number
  truncated: boolean
  bytes: number
}
/** frames: subframe IDs of the run's document seen so far (bounded), for nested iframes. */
export type Run = { id: number; documentId?: string; ev: EventRec[]; domDone?: boolean; eventDropped?: number; resources?: ResourceLedger; frames?: number[] }
