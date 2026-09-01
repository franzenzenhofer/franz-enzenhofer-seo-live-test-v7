import { attributesOf, elementFact, factBucket, isCriticalFact, type FactBucket } from './domFacts.element'
import { normalizedTextLength, walkNodes } from './domFacts.walk'
import type { DomElementFact, DomPhase, DomPhaseFacts } from './domFacts.types'

const PARAMETERIZED_LINK_LIMIT = 12
// Real-world heads run 4-109 elements (~19 KB worst case measured across major
// news/commerce sites) and every one of them can carry an indexing directive,
// so head gets a budget that fits whole heads. Anchors and resources stay
// samples - their rules either sample by design or keep their critical items.
const ELEMENT_CHAR_BUDGET = 26_000
const HEAD_CHAR_BUDGET = 20_000
const BUCKET_LIMITS: Record<FactBucket, number> = { head: 150, anchor: 10, resource: 20 }

export const collectDomFacts = (doc: Document, phase: DomPhase): DomPhaseFacts => {
  const elements: DomElementFact[] = []
  const used: Record<FactBucket, number> = { head: 0, anchor: 0, resource: 0 }
  const truncated = new Set<FactBucket>()
  const parameterizedLinks: string[] = []
  let parameterizedLinkCount = 0
  let anchorCount = 0
  let elementChars = 0
  let headChars = 0
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
        if (parameterizedLinks.length < PARAMETERIZED_LINK_LIMIT) parameterizedLinks.push(href.slice(0, 512))
      }
    }
    const bucket = factBucket(element, doc)
    if (!bucket) return
    const critical = isCriticalFact(element, bucket)
    if (!critical && used[bucket] >= BUCKET_LIMITS[bucket]) { drop(bucket, false); return }
    const fact = elementFact(element, doc)
    const factChars = JSON.stringify(fact).length
    if (elementChars + factChars > ELEMENT_CHAR_BUDGET) { drop(bucket, critical); return }
    if (bucket === 'head' && headChars + factChars > HEAD_CHAR_BUDGET) { drop(bucket, critical); return }
    used[bucket]++
    elementChars += factChars
    if (bucket === 'head') headChars += factChars
    elements.push(fact)
  })

  return {
    phase, nodeCount: metrics.count, maxDepth: metrics.maxDepth,
    textLength: normalizedTextLength(doc.body), scriptCount, blockingScriptCount,
    anchorCount, parameterizedLinkCount, parameterizedLinks,
    parameterizedLinksTruncated: parameterizedLinkCount > parameterizedLinks.length,
    elements, elementsTruncated: truncated.size > 0,
    truncatedBuckets: [...truncated], criticalTruncated,
    documentAttributes: attributesOf(doc.documentElement),
  }
}
