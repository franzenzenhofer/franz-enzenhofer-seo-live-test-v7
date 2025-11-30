import type { Rule } from '@/core/types'

const LABEL = 'BODY'
const NAME = 'Internal link HTTP status'
const RULE_ID = 'body:internal-link-status'
const SPEC = 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status'
const LIMIT = 5

const isInternal = (href: string, base: URL) => {
  if (!href) return false
  if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false
  try {
    const u = href.startsWith('http') ? new URL(href) : new URL(href, base)
    return u.host === base.host
  } catch {
    return false
  }
}

export const internalLinkStatusRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    let base: URL
    try {
      base = new URL(page.url)
    } catch {
      return { label: LABEL, name: NAME, message: 'Invalid page URL', type: 'runtime_error', priority: 10, details: { reference: SPEC } }
    }
    const anchors = Array.from(page.doc.querySelectorAll<HTMLAnchorElement>('a[href]'))
    const links = anchors.map((a) => a.getAttribute('href') || '').filter((h) => isInternal(h, base)).slice(0, LIMIT)
    if (!links.length) {
      return { label: LABEL, name: NAME, message: 'No internal links found to test.', type: 'info', priority: 900, details: { reference: SPEC } }
    }

    const checks = await Promise.all(links.map(async (href) => {
      const target = href.startsWith('http') ? href : new URL(href, base).toString()
      try {
        const res = await fetch(target, { redirect: 'follow' })
        return { href: target, status: res.status }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        return { href: target, status: 0, error: msg }
      }
    }))

    const failures = checks.filter((c) => !c.status || c.status >= 400 || c.error)
    const okCount = checks.length - failures.length
    const type = failures.length ? 'warn' : 'ok'
    const message = failures.length
      ? `${failures.length}/${checks.length} internal link(s) failed (>=400 or network error).`
      : `All ${okCount} internal link(s) returned <400.`

    return {
      label: LABEL,
      name: NAME,
      message,
      type,
      priority: failures.length ? 200 : 850,
      details: { linksTested: checks, failures, reference: SPEC },
    }
  },
}
