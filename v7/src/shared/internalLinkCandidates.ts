import { getDomPath } from './dom-path'
import { factByteSize, INTERNAL_LINK_CANDIDATE_BYTE_BUDGET } from './domFacts.budget'
import { unsafeProbeReason } from './probeSafety'

export type InternalLinkCandidate = { url: string; domPath: string }
export const INTERNAL_LINK_SAMPLE_SIZE = 5

const internalUrlForHost = (href: string, host: string, baseUri: string): string | null => {
  if (!href.trim() || href.trim().startsWith('#')) return null
  try {
    const url = new URL(href, baseUri)
    if (!['http:', 'https:'].includes(url.protocol) || url.host !== host) return null
    url.hash = ''
    // Back-office, action and token links are never sampled: requesting one IS the action.
    return unsafeProbeReason(url.href) ? null : url.href
  } catch { return null }
}

export const internalHttpUrl = (href: string, pageUrl: string, baseUri = pageUrl): string | null => {
  try { return internalUrlForHost(href, new URL(pageUrl).host, baseUri) } catch { return null }
}

const priorityOf = (url: string, seed: number): number => {
  let hash = seed
  for (let index = 0; index < url.length; index++) hash = Math.imul(hash ^ url.charCodeAt(index), 16777619)
  return hash >>> 0
}

// Bottom-k URL hashes produce a unique sample across the complete DOM traversal
// without keeping a set of every link or letting a navigation bar starve it.
export const collectInternalLinkCandidates = (
  doc: Document, seed = Math.floor(Math.random() * 0xffffffff), byteBudget = INTERNAL_LINK_CANDIDATE_BYTE_BUDGET,
) => {
  const empty = { internalLinkCandidates: [] as InternalLinkCandidate[], internalLinkCount: 0, internalLinkCandidatesOmitted: 0 }
  // Resolved ONCE: this loop runs over every anchor on the page.
  const baseUri = doc.baseURI
  let host = ''
  try { host = new URL(doc.URL).host } catch { return empty }
  const anchors = doc.querySelectorAll<HTMLAnchorElement>('a[href]')
  const best: Array<{ url: string; element: Element; priority: number }> = []
  let internalLinkCount = 0
  for (let index = 0; index < anchors.length; index++) {
    const element = anchors.item(index)
    if (!element) continue
    const url = internalUrlForHost(element.getAttribute('href') || '', host, baseUri)
    if (!url) continue
    internalLinkCount++
    if (best.some((entry) => entry.url === url)) continue
    const priority = priorityOf(url, seed)
    if (best.length === INTERNAL_LINK_SAMPLE_SIZE && priority >= best[best.length - 1]!.priority) continue
    best.push({ url, element, priority })
    best.sort((a, b) => a.priority - b.priority)
    if (best.length > INTERNAL_LINK_SAMPLE_SIZE) best.pop()
  }
  // DOM paths are built only for the surviving five, never for every
  // provisional candidate a long page produces.
  const internalLinkCandidates: InternalLinkCandidate[] = []
  let internalLinkCandidatesOmitted = 0
  for (const entry of best) {
    const candidate = { url: entry.url, domPath: getDomPath(entry.element) }
    if (factByteSize([...internalLinkCandidates, candidate]) > byteBudget) { internalLinkCandidatesOmitted++; continue }
    internalLinkCandidates.push(candidate)
  }
  return { internalLinkCandidates, internalLinkCount, internalLinkCandidatesOmitted }
}
