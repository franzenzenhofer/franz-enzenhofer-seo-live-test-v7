import { attributesOf, elementFact, factBucket, type FactBucket } from './domFacts.element'
import { normalizedTextLength, walkNodes } from './domFacts.walk'
import type { DomPhase, DomPhaseFacts } from './domFacts.types'

const PARAMETERIZED_LINK_LIMIT = 50
const BUCKET_LIMITS: Record<FactBucket, number> = { head: 100, anchor: 50, resource: 50 }

export const collectDomFacts = (doc: Document, phase: DomPhase): DomPhaseFacts => {
  const elements: DomPhaseFacts['elements'] = []
  const used: Record<FactBucket, number> = { head: 0, anchor: 0, resource: 0 }
  const parameterizedLinks: string[] = []
  let parameterizedLinkCount = 0
  let elementsTruncated = false
  let scriptCount = 0
  let blockingScriptCount = 0
  const metrics = walkNodes(doc.documentElement, (node) => {
    if (node.nodeType !== 1) return
    const element = node as Element
    const tag = element.tagName.toLowerCase()
    if (tag === 'script') {
      scriptCount++
      if (element.hasAttribute('src') && !element.hasAttribute('async') && !element.hasAttribute('defer')) blockingScriptCount++
    }
    if (tag === 'a') {
      const href = element.getAttribute('href') || ''
      if (href.includes('?')) {
        parameterizedLinkCount++
        if (parameterizedLinks.length < PARAMETERIZED_LINK_LIMIT) parameterizedLinks.push(href.slice(0, 2_048))
      }
    }
    const bucket = factBucket(element, doc)
    if (!bucket) return
    if (used[bucket] >= BUCKET_LIMITS[bucket]) { elementsTruncated = true; return }
    used[bucket]++
    elements.push(elementFact(element, doc))
  })
  return {
    phase, nodeCount: metrics.count, maxDepth: metrics.maxDepth,
    textLength: normalizedTextLength(doc.body), scriptCount, blockingScriptCount,
    parameterizedLinkCount, parameterizedLinks,
    parameterizedLinksTruncated: parameterizedLinkCount > parameterizedLinks.length,
    elements, elementsTruncated, documentAttributes: attributesOf(doc.documentElement),
  }
}
