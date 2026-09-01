import type { Rule } from '@/core/types'
import { getDomPath } from '@/shared/dom-path'
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
const SPEC = 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status'
const SAMPLE_SIZE = 5

const isInternal = (href: string, base: URL) => {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false
  try {
    const u = href.startsWith('http') ? new URL(href) : new URL(href, base)
    return u.host === base.host
  } catch { return false }
}

const shuffle = <T>(arr: T[]): T[] => arr.map((v) => ({ v, s: Math.random() })).sort((a, b) => a.s - b.s).map((x) => x.v)

const summarizeStatuses = (checks: { status: number }[]): string => {
  const counts: Record<number, number> = {}
  checks.forEach((c) => { counts[c.status] = (counts[c.status] || 0) + 1 })
  return Object.entries(counts).map(([s, n]) => `${n}× ${s}`).join(', ')
}

export const internalLinkStatusRule: Rule = {
  id: RULE_ID, name: NAME, enabled: true, what: 'static',
  async run(page) {
    let base: URL
    try { base = new URL(page.url) } catch {
      return { label: LABEL, name: NAME, type: 'runtime_error', priority: 10, details: { reference: SPEC },
        message: 'Invalid page URL' }
    }
    const anchors = Array.from(page.doc.querySelectorAll<HTMLAnchorElement>('a[href]'))
    const mapped = anchors
      .map((a) => {
        const href = a.getAttribute('href') || ''
        if (!isInternal(href, base)) return null
        const url = href.startsWith('http') ? href : new URL(href, base).toString()
        return { url, href, el: a }
      })
      .filter((entry): entry is { url: string; href: string; el: HTMLAnchorElement } => Boolean(entry))
    const unique = new Map<string, { url: string; href: string; el: HTMLAnchorElement }>()
    mapped.forEach((entry) => { if (!unique.has(entry.url)) unique.set(entry.url, entry) })
    const candidates = Array.from(unique.values())
    const sampled = shuffle(candidates).slice(0, SAMPLE_SIZE)
    // In the browser pipeline this rule sees a bounded fact document, not the
    // real DOM: anchors are sampled. Totals must come from the collector's
    // exact anchorCount, never from the sample.
    const facts = page.staticFacts
    const anchorsTruncated = !!facts && facts.truncatedBuckets.includes('anchor')
    const pageAnchorCount = facts?.anchorCount
    if (!sampled.length) {
      if (anchorsTruncated && (pageAnchorCount || 0) > 0) {
        // The sample may hold only fragment/cross-host anchors (e.g. a nav bar)
        // while the page's internal links fell outside the bounded capture.
        const message = anchors.length
          ? `No internal links among the ${anchors.length} captured anchors; the bounded capture of this ${pageAnchorCount}-anchor page cannot test internal links.`
          : `Bounded DOM capture kept none of the page's ${pageAnchorCount} anchors, so internal links cannot be tested.`
        return { label: LABEL, name: NAME, type: 'runtime_error', priority: 900, message,
          details: { reference: SPEC, pageAnchorCount, capturedAnchors: anchors.length, anchorEvidenceTruncated: true } }
      }
      return { label: LABEL, name: NAME, type: 'info', priority: 900, details: { reference: SPEC, totalInternal: 0 },
        message: 'No internal links found to test.' }
    }
    const checks = await Promise.all(sampled.map(async (entry): Promise<LinkCheck> => {
      const url = entry.url
      try {
        const { chain } = await followRedirectChain(url)
        return {
          url, status: chain.finalStatus, finalUrl: chain.finalUrl, domPath: getDomPath(entry.el),
          redirectChain: chain, redirectChainText: formatRedirectChain(chain),
        }
      } catch (e) {
        const hops = e instanceof RedirectChainError ? e.hops : []
        return { url, status: 0, error: e instanceof Error ? e.message : String(e), domPath: getDomPath(entry.el),
          ...(hops.length ? { redirectChainHops: hops } : {}) }
      }
    }))
    const failures = checks.filter((c) => !c.status || c.status >= 400 || c.redirectChain?.loop || c.redirectChain?.capped)
    const redirecting = checks.filter((c) => c.redirectChain?.redirected)
    const statusSummary = summarizeStatuses(checks)
    const type = failures.length ? 'error' : 'ok'
    const scope = anchorsTruncated
      ? `Sampled ${checks.length} of ${candidates.length} captured internal links (bounded capture of a page with ${pageAnchorCount} anchors).`
      : failures.length
        ? `Sampled ${checks.length} of ${candidates.length} internal links.`
        : `Tested random sample of ${candidates.length} internal links.`
    // Every link that redirects (or fails) keeps its complete hop-by-hop chain in details - never summarized away.
    const chainTexts = checks
      .filter((c) => c.redirectChain && (c.redirectChain.redirected || c.redirectChain.loop || c.redirectChain.capped))
      .map((c) => c.redirectChainText)
      .join('\n\n')
    const redirectNote = redirecting.length ? ` ${redirecting.length} sampled link${redirecting.length > 1 ? 's' : ''} redirect.` : ''
    const message = failures.length
      ? `${failures.length}/${checks.length} links failed: ${failures.map((f) => `${f.status}`).join(', ')}. ${scope}${redirectNote}`
      : `All ${checks.length} sampled links OK (${statusSummary}). ${scope}${redirectNote}`
    const domPaths = sampled.map((entry) => getDomPath(entry.el)).filter((path) => path.length > 0)
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
        ...(anchorsTruncated ? {} : { totalInternal: candidates.length }),
        capturedInternal: candidates.length, sampleSize: checks.length,
        ...(facts ? { pageAnchorCount, anchorEvidenceTruncated: anchorsTruncated } : {}),
        domPaths, reference: SPEC } }
  },
}
