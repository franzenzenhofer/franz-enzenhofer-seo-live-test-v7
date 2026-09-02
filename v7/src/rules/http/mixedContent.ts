import type { Rule } from '@/core/types'
import { getDomPaths } from '@/shared/dom-path'
import { extractHtml } from '@/shared/html-utils'

const LABEL = 'HTTP'
const NAME = 'Mixed content'
const RULE_ID = 'http:mixed-content'

// Mixed content is defined over requests (W3C): only link relations that trigger a
// fetch count - rel=canonical/alternate/etc. never issue requests.
const fetchingLinks =
  'link[rel~=stylesheet][href], link[rel~=icon][href], link[rel~=preload][href], link[rel~=prefetch][href], link[rel~=modulepreload][href], link[rel~=manifest][href]'
const resourceSelectors = ['script[src]', fetchingLinks, 'img[src]', 'iframe[src]', 'video[src]', 'audio[src]', 'source[src]', 'embed[src]', 'object[data]']
const isHttp = (url: string | null | undefined) => typeof url === 'string' && url.trim().toLowerCase().startsWith('http://')
const buildDetails = (nodes: Element[], paths: string[]) => ({
  offenders: nodes.map((node, index) => ({ html: extractHtml(node), domPath: paths[index] || '' })),
  snippet: nodes.map(extractHtml).join('\n\n'),
  domPaths: paths,
  count: nodes.length,
})

export const mixedContentRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  meta: {
    provenance: 'standard',
    references: [
      'https://www.w3.org/TR/mixed-content/',
      'https://developer.chrome.com/docs/lighthouse/performance/redirects',
    ],
    description:
      'On HTTPS pages, flags fetched subresources (script/fetching link/img/iframe/video/audio/source/embed/object, plus network-captured resources) whose URLs start with http://; insecure form actions warn.',
  },
  async run(page) {
    if (!page.url.startsWith('https://')) {
      return { label: LABEL, name: NAME, message: 'Page is not HTTPS; mixed content check skipped.', type: 'info', priority: 900, details: {} }
    }

    const doc = page.doc
    const offenders: Element[] = []
    resourceSelectors.forEach((sel) => {
      doc.querySelectorAll(sel).forEach((el) => {
        const url = (el.getAttribute('src') || el.getAttribute('href') || el.getAttribute('data') || '').trim()
        if (isHttp(url)) offenders.push(el)
      })
    })

    const formOffenders: Element[] = []
    doc.querySelectorAll('form[action]').forEach((el) => {
      if (isHttp((el.getAttribute('action') || '').trim())) formOffenders.push(el)
    })

    const resourceUrls = Array.isArray(page.resources) ? page.resources : []
    const netOffenders = resourceUrls.filter((u) => isHttp(u))

    if (offenders.length) {
      const domPaths = getDomPaths(offenders)
      return {
        label: LABEL,
        name: NAME,
        message: `${offenders.length} mixed-content resource${offenders.length === 1 ? '' : 's'} loaded over HTTP on an HTTPS page.`,
        type: 'error',
        priority: 80,
        details: { ...buildDetails(offenders, domPaths), fix: 'Serve all subresources over HTTPS or remove them.', networkResources: netOffenders, networkCount: netOffenders.length, insecureFormActionCount: formOffenders.length },
      }
    }

    if (netOffenders.length) {
      return {
        label: LABEL,
        name: NAME,
        message: `${netOffenders.length} mixed-content resource${netOffenders.length === 1 ? '' : 's'} detected from network capture.`,
        type: 'error',
        priority: 90,
        details: { resources: netOffenders, count: netOffenders.length, insecureFormActionCount: formOffenders.length },
      }
    }

    if (formOffenders.length) {
      const domPaths = getDomPaths(formOffenders)
      return {
        label: LABEL,
        name: NAME,
        message: `${formOffenders.length} form${formOffenders.length === 1 ? '' : 's'} on this HTTPS page submit${formOffenders.length === 1 ? 's' : ''} to an insecure http:// action.`,
        type: 'warn',
        priority: 200,
        details: { ...buildDetails(formOffenders, domPaths), fix: 'Point form actions at HTTPS endpoints.' },
      }
    }

    return { label: LABEL, name: NAME, message: 'No mixed content resources found.', type: 'ok', priority: 850, details: {} }
  },
}
