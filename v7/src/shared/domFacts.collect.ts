import { ANCHOR_FACT_BYTE_BUDGET, BUCKET_LIMITS, factByteSize, GENERAL_FACT_BYTE_BUDGET, HEAD_FACT_BYTE_BUDGET, PARAMETERIZED_LINK_LIMIT } from './domFacts.budget'
import { criticalFactOverflows } from './domFacts.critical'
import { attributesOf, elementFact, factBucket, isCriticalFact, type FactBucket } from './domFacts.element'
import { normalizedTextLength, walkNodes } from './domFacts.walk'
import type { DomElementFact, DomPhase, DomPhaseFacts } from './domFacts.types'

export const collectDomFacts = (doc: Document, phase: DomPhase): DomPhaseFacts => {
  const elements: DomElementFact[] = []
  const used: Record<FactBucket, number> = { head: 0, anchor: 0, resource: 0 }
  const truncated = new Set<FactBucket>()
  const documentAttributes = attributesOf(doc.documentElement)
  const parameterizedLinks: string[] = []
  let parameterizedLinkCount = 0
  let anchorCount = 0
  let generalBytes = factByteSize(documentAttributes)
  let anchorBytes = 0
  let headBytes = 0
  let criticalTruncated = false
  let scriptCount = 0
  let blockingScriptCount = 0

  const drop = (bucket: FactBucket, critical: boolean) => {
    truncated.add(bucket)
    if (critical) criticalTruncated = true
  }

  const metrics = walkNodes(doc.documentElement, (node) => {
    if (node.nodeType !== 1) return
    const element = node as Element
    const tag = element.tagName.toLowerCase()
    if (tag === 'script') {
      scriptCount++
      if (element.hasAttribute('src') && !element.hasAttribute('async') && !element.hasAttribute('defer')) blockingScriptCount++
    }
    if (tag === 'a') {
      anchorCount++
      const href = element.getAttribute('href') || ''
      if (href.includes('?')) {
        parameterizedLinkCount++
        const entry = href.slice(0, 512)
        const entryBytes = factByteSize(entry)
        if (parameterizedLinks.length < PARAMETERIZED_LINK_LIMIT && generalBytes + entryBytes <= GENERAL_FACT_BYTE_BUDGET) {
          parameterizedLinks.push(entry)
          generalBytes += entryBytes
        }
      }
    }
    const bucket = factBucket(element, doc)
    if (!bucket) return
    const critical = isCriticalFact(element, bucket)
    if (critical && criticalFactOverflows(element)) criticalTruncated = true
    if (!critical && used[bucket] >= BUCKET_LIMITS[bucket]) { drop(bucket, false); return }
    const fact = elementFact(element, doc, critical)
    const factBytes = factByteSize(fact)
    const pool = bucket === 'anchor' ? anchorBytes : generalBytes
    const poolBudget = bucket === 'anchor' ? ANCHOR_FACT_BYTE_BUDGET : GENERAL_FACT_BYTE_BUDGET
    if (pool + factBytes > poolBudget) { drop(bucket, critical); return }
    if (bucket === 'head' && headBytes + factBytes > HEAD_FACT_BYTE_BUDGET) { drop(bucket, critical); return }
    used[bucket]++
    if (bucket === 'anchor') anchorBytes += factBytes
    else generalBytes += factBytes
    if (bucket === 'head') headBytes += factBytes
    elements.push(fact)
  })

  return {
    phase, nodeCount: metrics.count, maxDepth: metrics.maxDepth,
    textLength: normalizedTextLength(doc.body), scriptCount, blockingScriptCount,
    anchorCount, parameterizedLinkCount, parameterizedLinks,
    parameterizedLinksTruncated: parameterizedLinkCount > parameterizedLinks.length,
    elements, elementsTruncated: truncated.size > 0,
    truncatedBuckets: [...truncated], criticalTruncated,
    documentAttributes,
  }
}
