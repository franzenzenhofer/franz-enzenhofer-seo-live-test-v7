import { contentSummary } from './contentText'
import { factByteSize } from './domFacts.budget'
import { attributesOf } from './domFacts.element'
import { scanDomFacts } from './domFacts.scan'
import { collectInternalLinkCandidates } from './internalLinkCandidates'
import { collectSeoPhaseSignals } from './seoPhaseSignals'
import type { DomPhase, DomPhaseFacts } from './domFacts.types'

export const collectDomFacts = (doc: Document, phase: DomPhase): DomPhaseFacts => {
  const documentAttributes = attributesOf(doc.documentElement)
  const content = contentSummary(doc)
  const seoSignals = collectSeoPhaseSignals(doc)
  const baseUri = doc.baseURI
  // Candidates are chosen across the COMPLETE DOM (own pass, bottom-k hash), so
  // a long navigation bar cannot starve the sample, and they claim their
  // reserved slice of the anchor pool before display anchors are budgeted.
  const links = collectInternalLinkCandidates(doc)
  const scan = scanDomFacts(doc, {
    general: factByteSize({ documentAttributes, content, seoSignals, baseUri }),
    anchor: factByteSize(links.internalLinkCandidates),
  })
  return {
    ...scan,
    phase,
    textLength: content.length,
    parameterizedLinksTruncated: scan.parameterizedLinkCount > scan.parameterizedLinks.length,
    documentAttributes, content, seoSignals, baseUri,
    internalLinkCandidates: links.internalLinkCandidates,
    internalLinkCount: links.internalLinkCount,
    internalLinkCandidatesOmitted: links.internalLinkCandidatesOmitted,
  }
}
