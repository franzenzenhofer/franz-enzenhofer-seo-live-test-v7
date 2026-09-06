import { ANCHOR_FACT_BYTE_BUDGET, BUCKET_LIMITS, factByteSize, GENERAL_FACT_BYTE_BUDGET, HEAD_FACT_BYTE_BUDGET, PARAMETERIZED_LINK_LIMIT } from './domFacts.budget'
import { criticalFactOverflows } from './domFacts.critical'
import { elementFact, factBucket, isCriticalFact } from './domFacts.element'
import { walkNodes } from './domFacts.walk'
import type { DomElementFact, DomScan, FactBucket, ScanBudget } from './domFacts.types'

// Walks the FULL live document once and keeps a bounded, budgeted subset of
// element facts. Counters (anchors, scripts, parameterized links) stay exact
// even where the evidence pools overflow, so rules never infer totals from a
// truncated sample. `used` carries bytes already spent by the caller.
export const scanDomFacts = (doc: Document, used: ScanBudget): DomScan => {
  const elements: DomElementFact[] = []
  const kept: Record<FactBucket, number> = { head: 0, anchor: 0, resource: 0 }
  const truncated = new Set<FactBucket>()
  const parameterizedLinks: string[] = []
  let parameterizedLinkCount = 0
  let anchorCount = 0
  let scriptCount = 0
  let blockingScriptCount = 0
  let generalBytes = used.general
  let anchorBytes = used.anchor
  let headBytes = 0
  let criticalTruncated = false

  const drop = (bucket: FactBucket, critical: boolean) => {
    truncated.add(bucket)
    if (critical) criticalTruncated = true
  }

  const count = (element: Element, tag: string) => {
    if (tag === 'script') {
      scriptCount++
      if (element.hasAttribute('src') && !element.hasAttribute('async') && !element.hasAttribute('defer')) blockingScriptCount++
      return
    }
    if (tag !== 'a') return
    anchorCount++
    const href = element.getAttribute('href') || ''
    if (!href.includes('?')) return
    parameterizedLinkCount++
    const entry = href.slice(0, 512)
    const entryBytes = factByteSize(entry)
    if (parameterizedLinks.length >= PARAMETERIZED_LINK_LIMIT || generalBytes + entryBytes > GENERAL_FACT_BYTE_BUDGET) return
    parameterizedLinks.push(entry)
    generalBytes += entryBytes
  }

  const keep = (element: Element) => {
    const bucket = factBucket(element, doc)
    if (!bucket) return
    const critical = isCriticalFact(element, bucket)
    if (critical && criticalFactOverflows(element)) criticalTruncated = true
    if (!critical && kept[bucket] >= BUCKET_LIMITS[bucket]) return drop(bucket, false)
    const fact = elementFact(element, doc, critical)
    const factBytes = factByteSize(fact)
    const anchor = bucket === 'anchor'
    const poolBudget = anchor ? ANCHOR_FACT_BYTE_BUDGET : GENERAL_FACT_BYTE_BUDGET
    if ((anchor ? anchorBytes : generalBytes) + factBytes > poolBudget) return drop(bucket, critical)
    if (bucket === 'head' && headBytes + factBytes > HEAD_FACT_BYTE_BUDGET) return drop(bucket, critical)
    kept[bucket]++
    if (anchor) anchorBytes += factBytes
    else generalBytes += factBytes
    if (bucket === 'head') headBytes += factBytes
    elements.push(fact)
  }

  const metrics = walkNodes(doc.documentElement, (node) => {
    if (node.nodeType !== 1) return
    const element = node as Element
    count(element, element.tagName.toLowerCase())
    keep(element)
  })

  return {
    elements, truncatedBuckets: [...truncated], criticalTruncated, elementsTruncated: truncated.size > 0,
    nodeCount: metrics.count, maxDepth: metrics.maxDepth,
    anchorCount, scriptCount, blockingScriptCount, parameterizedLinks, parameterizedLinkCount,
  }
}
