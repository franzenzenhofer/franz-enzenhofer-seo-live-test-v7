import { collectDomFacts, type DomPhase } from '@/shared/domFacts'
import type { Page } from '@/core/types'

const readTiming = (timing: Performance): Page['navigationTiming'] => {
  try {
    const nav = timing.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    const paints = timing.getEntriesByType('paint')
    return {
      ...(nav ? { nextHopProtocol: nav.nextHopProtocol || '', transferSize: nav.transferSize,
        encodedBodySize: nav.encodedBodySize, decodedBodySize: nav.decodedBodySize, type: nav.type } : {}),
      firstPaint: paints.find((entry) => entry.name === 'first-paint')?.startTime,
      firstContentfulPaint: paints.find((entry) => entry.name === 'first-contentful-paint')?.startTime,
    }
  } catch { return undefined }
}

export const capturePhaseSnapshot = (doc: Document, phase: DomPhase, url: string, timing: Performance = performance) => {
  const capturedAt = Date.now()
  const baseUri = doc.baseURI
  const facts = collectDomFacts(doc, phase)
  return { facts, url, baseUri, capturedAt, navigationTiming: readTiming(timing) }
}
