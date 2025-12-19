import type { Rule } from '@/core/types'

const LABEL = 'HTTP'
const NAME = 'Mixed content'
const RULE_ID = 'http:mixed-content'
const SPEC = 'https://developer.mozilla.org/docs/Web/Security/Mixed_content'
const SAMPLE_LIMIT = 3

const selectors = ['script[src]', 'link[href]', 'img[src]', 'iframe[src]', 'video[src]', 'audio[src]', 'source[src]', 'embed[src]', 'object[data]', 'form[action]']
const isHttp = (url: string | null | undefined) => typeof url === 'string' && url.trim().toLowerCase().startsWith('http://')
const buildDetails = (nodes: Element[], paths: string[]) => {
  const preview = nodes.slice(0, SAMPLE_LIMIT)
  const snippet = preview.map((n) => n.outerHTML).join('\n\n')
  const omitted = nodes.length - preview.length
  return {
    snippet: omitted > 0 ? `${snippet}\n\n…${omitted} more resources omitted` : snippet,
    domPaths: paths.slice(0, preview.length),
    count: nodes.length,
  }
}

export const mixedContentRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  async run(page) {
    if (!page.url.startsWith('https://')) {
      return { label: LABEL, name: NAME, message: 'Page is not HTTPS; mixed content check skipped.', type: 'info', priority: 900, details: { reference: SPEC } }
    }

    const doc = page.doc
    const offenders: Element[] = []
    const paths: string[] = []
    selectors.forEach((sel) => {
      doc.querySelectorAll(sel).forEach((el, idx) => {
        const url = (el.getAttribute('src') || el.getAttribute('href') || el.getAttribute('data') || '').trim()
        const action = el instanceof HTMLFormElement ? (el.getAttribute('action') || '').trim() : ''
        const candidate = sel.startsWith('form') ? action || url : url
        if (!candidate) return
        if (!isHttp(candidate)) return
        if (!isHttp(url)) return
        offenders.push(el)
        paths.push(`${sel}:nth-of-type(${idx + 1})`)
      })
    })

    const resourceUrls = Array.isArray(page.resources) ? page.resources : []
    const netOffenders = resourceUrls.filter((u) => isHttp(u))

    if (!offenders.length) {
      if (!netOffenders.length) {
        return { label: LABEL, name: NAME, message: 'No mixed content resources found.', type: 'ok', priority: 850, details: { reference: SPEC } }
      }
      return {
        label: LABEL,
        name: NAME,
        message: `${netOffenders.length} mixed-content resource${netOffenders.length === 1 ? '' : 's'} detected from network capture.`,
        type: 'error',
        priority: 90,
        details: { reference: SPEC, resources: netOffenders.slice(0, SAMPLE_LIMIT), count: netOffenders.length },
      }
    }

    return {
      label: LABEL,
      name: NAME,
      message: `${offenders.length} mixed-content resource${offenders.length === 1 ? '' : 's'} loaded over HTTP on an HTTPS page.`,
      type: 'error',
      priority: 80,
      details: { ...buildDetails(offenders, paths), reference: SPEC, fix: 'Serve all subresources over HTTPS or remove them.', networkResources: netOffenders.slice(0, SAMPLE_LIMIT), networkCount: netOffenders.length },
    }
  },
}
