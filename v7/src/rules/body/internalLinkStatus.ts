import { checkedLinks, statusesRow } from './internalLinkStatus.evidence'
import type { LinkCheck } from './internalLinkStatus.evidence'

import type { Rule } from '@/core/types'
import { getDomPath } from '@/shared/dom-path'
import { internalHttpUrl, INTERNAL_LINK_SAMPLE_SIZE } from '@/shared/internalLinkCandidates'
import { recordCounts } from '@/shared/presentation/counts'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import { followRedirectChain } from '@/shared/redirectChain'
import { RedirectChainError } from '@/shared/redirectChainTypes'

const SAMPLE_SIZE = INTERNAL_LINK_SAMPLE_SIZE
const isParseableUrl = (value: string): boolean => { try { return !!new URL(value) } catch { return false } }
const shuffle = <T>(arr: T[]): T[] => arr.map((v) => ({ v, s: Math.random() })).sort((a, b) => a.s - b.s).map((x) => x.v)

const checked = [
  textField('Selector', 'a[href]'),
  textField('Sample size', `Up to ${SAMPLE_SIZE} unique internal links, chosen at random`),
  textField('Probe', 'Anonymous HTTP request per sampled URL, following redirects'),
  textField('Failure criterion', 'Status 400-599, a redirect (300-399), a redirect loop, or exceeding the redirect cap'),
  textField('Inconclusive criterion', 'No status captured, or status 401/403/429 (unverifiable, not broken)'),
]

export const internalLinkStatusRule: Rule = {
  id: 'body:internal-link-status', name: 'Internal link HTTP status', presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/http-network-errors',
      'https://www.rfc-editor.org/rfc/rfc9110.html#name-client-error-4xx',
    ],
    description: 'Fetches a random sample of up to 5 unique internal links and errors when any returns status >=400, fails, loops, or exceeds the redirect cap; reports redirect chains.',
  },
  async run(page, ctx) {
    if (!isParseableUrl(page.url)) return presentResult(internalLinkStatusRule, page, {
      input: 'Page URL', type: 'runtime_error', priority: 10,
      values: [textField('Current page URL', 'Invalid URL')], checked,
      noMarkup: 'None - page URL is invalid; no internal links were probed',
    })
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
        if (!facts.internalLinkCount) return presentResult(internalLinkStatusRule, page, {
          input: 'Static DOM + Page URL', type: 'info', priority: 900,
          values: [textField('Internal links found', 0)], checked,
          detailValues: [textField('Page anchors', pageAnchorCount ?? 'Not captured')],
          noMarkup: 'None - no internal links found to test',
        })
        return presentResult(internalLinkStatusRule, page, {
          input: 'Static DOM + Page URL', type: 'runtime_error', priority: 900,
          values: [textField('Internal anchors', facts.internalLinkCount), textField('Links tested', 0)],
          detailValues: [textField('Candidates dropped', omitted), textField('Page anchors', pageAnchorCount ?? 'Not captured')],
          checked,
          noMarkup: 'None - no candidate URL fit the bounded evidence budget',
        })
      }
      if (anchorsTruncated && (pageAnchorCount || 0) > 0) {
        // The sample may hold only fragment/cross-host anchors (e.g. a nav bar)
        // while the page's internal links fell outside the bounded capture.
        return presentResult(internalLinkStatusRule, page, {
          input: 'Static DOM + Page URL', type: 'runtime_error', priority: 900,
          values: [textField('Page anchors', pageAnchorCount as number), textField('Links tested', 0)],
          detailValues: [textField('Captured anchors', anchors.length), textField('Anchor capture', 'Truncated')],
          checked,
          noMarkup: anchors.length ? 'None - no internal links among the captured anchors' : "None - bounded DOM capture kept none of the page's anchors",
        })
      }
      return presentResult(internalLinkStatusRule, page, {
        input: 'Static DOM + Page URL', type: 'info', priority: 900,
        values: [textField('Internal links found', 0)], checked,
        noMarkup: 'None - no internal links found to test',
      })
    }
    const checks: LinkCheck[] = await Promise.all(sampled.map(async (entry): Promise<LinkCheck> => {
      const url = entry.url
      try {
        const { chain } = await followRedirectChain(url, { signal: ctx.signal })
        return {
          url, status: chain.finalStatus, finalUrl: chain.finalUrl, domPath: entry.domPath, redirectChain: chain,
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
    const type = failures.length ? 'error' : inconclusive.length ? 'warn' : 'ok'
    const scope = facts?.internalLinkCandidates
      ? `${facts.internalLinkCount} eligible internal link anchors across the page`
      : anchorsTruncated
        ? `${candidates.length} unique captured internal link URLs (bounded capture of a page with ${pageAnchorCount} anchors)`
        : `${candidates.length} unique internal link URLs`
    return presentResult(internalLinkStatusRule, page, {
      input: 'Static DOM + Page URL + internal link HTTP responses', type, priority: failures.length ? 150 : 850,
      values: [statusesRow(checks), textField('Links tested', checks.length), textField('Failures', failures.length), textField('Inconclusive', inconclusive.length)],
      detailValues: [
        textField('Sampled from', scope), textField('Redirecting links', redirecting.length),
        ...(facts?.internalLinkCandidates ? [textField('Internal anchors', facts.internalLinkCount ?? 'Not captured'),
          textField('Candidates dropped', facts.internalLinkCandidatesOmitted ?? 0)] : []),
        ...(anchorsTruncated ? [textField('Page anchors', pageAnchorCount ?? 'Not captured'), textField('Anchor capture', 'Truncated')] : []),
        ...recordCounts({ found: checks.length, markup: 0, evidence: checks.length }),
        ...(!facts?.internalLinkCandidates && !anchorsTruncated ? [textField('Unique internal link URLs', candidates.length)] : []),
      ],
      checked,
      evidence: checkedLinks(checks),
      noMarkup: 'Not retained: this rule checks HTTP responses, not document markup',
    })
  },
}
