import type { Rule } from '@/core/types'
import { getDomPath } from '@/shared/dom-path'

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
    if (!sampled.length) {
      return { label: LABEL, name: NAME, type: 'info', priority: 900, details: { reference: SPEC, totalInternal: 0 },
        message: 'No internal links found to test.' }
    }
    const checks = await Promise.all(sampled.map(async (entry) => {
      const url = entry.url
      try {
        const res = await fetch(url, { redirect: 'follow' })
        return { url, status: res.status, domPath: getDomPath(entry.el) }
      } catch (e) { return { url, status: 0, error: e instanceof Error ? e.message : String(e), domPath: getDomPath(entry.el) } }
    }))
    const failures = checks.filter((c) => !c.status || c.status >= 400)
    const statusSummary = summarizeStatuses(checks)
    const type = failures.length ? 'error' : 'ok'
    const message = failures.length
      ? `${failures.length}/${checks.length} links failed: ${failures.map((f) => `${f.status}`).join(', ')}. Sampled ${checks.length} of ${candidates.length} internal links.`
      : `All ${checks.length} sampled links OK (${statusSummary}). Tested random sample of ${candidates.length} internal links.`
    const domPaths = sampled.map((entry) => getDomPath(entry.el)).filter((path) => path.length > 0)
    return { label: LABEL, name: NAME, message, type, priority: failures.length ? 150 : 850,
      details: { checked: checks, failures, statusSummary, totalInternal: candidates.length, sampleSize: checks.length, domPaths, reference: SPEC } }
  },
}
