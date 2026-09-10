import type { Rule } from '@/core/types'
import { getDomPath } from '@/shared/dom-path'
import { internalHttpUrl, INTERNAL_LINK_SAMPLE_SIZE } from '@/shared/internalLinkCandidates'
import { followRedirectChain } from '@/shared/redirectChain'
import { formatRedirectChain } from '@/shared/redirectChainFormat'
import { RedirectChainError } from '@/shared/redirectChainTypes'
import type { RedirectChain, RedirectHop } from '@/shared/redirectChainTypes'

type LinkCheck = {
  url: string
  status: number
  domPath: string
  finalUrl?: string
  error?: string
  redirectChain?: RedirectChain
  redirectChainText?: string
  redirectChainHops?: RedirectHop[]
}

const LABEL = 'BODY'
const NAME = 'Internal link HTTP status'
const RULE_ID = 'body:internal-link-status'
const SAMPLE_SIZE = INTERNAL_LINK_SAMPLE_SIZE

const isParseableUrl = (value: string): boolean => { try { return !!new URL(value) } catch { return false } }

const shuffle = <T>(arr: T[]): T[] => arr.map((v) => ({ v, s: Math.random() })).sort((a, b) => a.s - b.s).map((x) => x.v)

const summarizeStatuses = (checks: { status: number }[]): string => {
  const counts: Record<number, number> = {}
  checks.forEach((c) => { counts[c.status] = (counts[c.status] || 0) + 1 })
  return Object.entries(counts).map(([s, n]) => `${n}× ${s}`).join(', ')
}

export const internalLinkStatusRule: Rule = {
  id: RULE_ID, name: NAME, enabled: true, what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/http-network-errors',
      'https://www.rfc-editor.org/rfc/rfc9110.html#name-client-error-4xx',
    ],
    description: 'Fetches a random sample of up to 5 unique internal links and errors when any returns status >=400, fails, loops, or exceeds the redirect cap; reports redirect chains.',
  },
  async run(page, ctx) {
    if (!isParseableUrl(page.url)) {
      return { label: LABEL, name: NAME, type: 'runtime_error', priority: 10,
        message: 'Invalid page URL' }
    }
    const anchors = Array.from(page.doc.querySelectorAll<HTMLAnchorElement>('a[href]'))
    const mapped = anchors.flatMap((el) => {
      const url = internalHttpUrl(el.getAttribute('href') || '', page.url, page.baseUri || page.url)
      return url ? [{ url, domPath: getDomPath(el) }] : []
    })
    const unique = new Map(mapped.map((entry) => [entry.url, entry]))
    const candidates = page.staticFacts?.internalLinkCandidates ?? Array.from(unique.values())
    const sampled = shuffle(candidates).slice(0, SAMPLE_SIZE)
    // In the browser pipeline this rule sees a bounded fact document, not the
    // real DOM: anchors are sampled. Totals must come from the collector's
    // exact anchorCount, never from the sample.
    const facts = page.staticFacts
    const anchorsTruncated = !!facts && facts.truncatedBuckets.includes('anchor')
    const pageAnchorCount = facts?.anchorCount
    if (!sampled.length) {
      // With a candidate list present, "empty" has two very different meanings:
      // the page has no eligible internal link, or every candidate was pushed
      // out by the evidence byte bound. Never report the second as the first.
      if (facts?.internalLinkCandidates) {
        const omitted = facts.internalLinkCandidatesOmitted || 0
        if (!facts.internalLinkCount) {
          return { label: LABEL, name: NAME, type: 'info', priority: 900,
            details: { internalLinkCount: 0, pageAnchorCount },
            message: 'No internal links found to test.' }
        }
        return { label: LABEL, name: NAME, type: 'runtime_error', priority: 900,
          details: { internalLinkCount: facts.internalLinkCount, candidateOmissions: omitted, pageAnchorCount },
          message: `${facts.internalLinkCount} internal link anchors were counted but no candidate URL fit the bounded evidence budget (${omitted} omitted), so none could be tested.` }
      }
      if (anchorsTruncated && (pageAnchorCount || 0) > 0) {
        // The sample may hold only fragment/cross-host anchors (e.g. a nav bar)
        // while the page's internal links fell outside the bounded capture.
        const message = anchors.length
          ? `No internal links among the ${anchors.length} captured anchors; the bounded capture of this ${pageAnchorCount}-anchor page cannot test internal links.`
          : `Bounded DOM capture kept none of the page's ${pageAnchorCount} anchors, so internal links cannot be tested.`
        return { label: LABEL, name: NAME, type: 'runtime_error', priority: 900, message,
          details: { pageAnchorCount, capturedAnchors: anchors.length, anchorEvidenceTruncated: true } }
      }
      return { label: LABEL, name: NAME, type: 'info', priority: 900, details: { totalInternal: 0 },
        message: 'No internal links found to test.' }
    }
    const checks = await Promise.all(sampled.map(async (entry): Promise<LinkCheck> => {
      const url = entry.url
      try {
        const { chain } = await followRedirectChain(url, { signal: ctx.signal })
        return {
          url, status: chain.finalStatus, finalUrl: chain.finalUrl, domPath: entry.domPath,
          redirectChain: chain, redirectChainText: formatRedirectChain(chain),
        }
      } catch (e) {
        const hops = e instanceof RedirectChainError ? e.hops : []
        return { url, status: 0, error: e instanceof Error ? e.message : String(e), domPath: entry.domPath,
          ...(hops.length ? { redirectChainHops: hops } : {}) }
      }
    }))
    // Probes are anonymous by design (like Googlebot): a login wall (401) is unverifiable, not broken.
    const inconclusive = checks.filter((c) => !c.status || c.status === 401 || c.status === 403 || c.status === 429)
    const failures = checks.filter((c) => c.redirectChain?.loop || c.redirectChain?.capped ||
      (!inconclusive.includes(c) && (c.status >= 400 || (c.status >= 300 && c.status < 400))))
    const redirecting = checks.filter((c) => c.redirectChain?.redirected)
    const statusSummary = summarizeStatuses(checks)
    const type = failures.length ? 'error' : inconclusive.length ? 'warn' : 'ok'
    const scope = facts?.internalLinkCandidates
      ? `Sampled ${checks.length} URLs from ${facts.internalLinkCount} eligible internal link anchors across the page.`
      : anchorsTruncated
      ? `Sampled ${checks.length} of ${candidates.length} captured internal links (bounded capture of a page with ${pageAnchorCount} anchors).`
      : failures.length
        ? `Sampled ${checks.length} of ${candidates.length} internal links.`
        : `Tested ${checks.length} sampled URLs from ${candidates.length} internal links.`
    // Every link that redirects (or fails) keeps its complete hop-by-hop chain in details - never summarized away.
    const chainTexts = checks
      .filter((c) => c.redirectChain && (c.redirectChain.redirected || c.redirectChain.loop || c.redirectChain.capped))
      .map((c) => c.redirectChainText)
      .join('\n\n')
    const redirectNote = redirecting.length ? ` ${redirecting.length} sampled link${redirecting.length > 1 ? 's' : ''} redirect.` : ''
    const message = failures.length
      ? `${failures.length}/${checks.length} links failed: ${failures.map((f) => `${f.status}`).join(', ')}. ${scope}${redirectNote}`
      : inconclusive.length
        ? `${inconclusive.length}/${checks.length} sampled links could not be verified (network/access/rate limit). ${scope}${redirectNote}`
        : `All ${checks.length} sampled links OK (${statusSummary}). ${scope}${redirectNote}`
    const domPaths = sampled.map((entry) => entry.domPath).filter((path) => path.length > 0)
    // The structured chain is internal; the text block is its one rendered form.
    const summarize = (check: LinkCheck): Omit<LinkCheck, 'redirectChain' | 'redirectChainText'> => {
      const copy = { ...check }
      delete copy.redirectChain
      delete copy.redirectChainText
      return copy
    }
    return { label: LABEL, name: NAME, message, type, priority: failures.length ? 150 : 850,
      details: { checked: checks.map(summarize), failures: failures.map(summarize), statusSummary, redirectingCount: redirecting.length,
        ...(chainTexts ? { redirectChainText: chainTexts } : {}),
        ...(!facts?.internalLinkCandidates && !anchorsTruncated ? { totalInternal: candidates.length } : {}),
        inconclusive, internalLinkCount: facts?.internalLinkCount, candidateOmissions: facts?.internalLinkCandidatesOmitted,
        capturedInternal: candidates.length, sampleSize: checks.length,
        ...(facts ? { pageAnchorCount, anchorEvidenceTruncated: anchorsTruncated } : {}),
        domPaths } }
  },
}
