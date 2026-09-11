import { resolvePageWebUrl } from '@/shared/resolvePageWebUrl'
import type { Rule } from '@/core/types'
import { textField, urlField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const findAmp = (d: Document) => {
  const el = d.querySelector('link[rel~="amphtml" i]')
  return { element: el, href: el?.getAttribute('href') || '' }
}

// Per the AMP cache-URL spec: every dash becomes a double dash, every dot a
// dash, forming the publisher subdomain of cdn.ampproject.org.
const ampCache = (href: string) => {
  try {
    const u = new URL(href)
    if (u.port || /(^|\.)xn--|[^a-z0-9.-]/i.test(u.hostname)) return ''
    let subdomain = u.hostname.replace(/-/g, '--').replace(/\./g, '-')
    if (subdomain.slice(2, 4) === '--') subdomain = `0-${subdomain}-0`
    if (subdomain.length > 63) return ''
    const secure = u.protocol === 'https:' ? 's/' : ''
    return `https://${subdomain}.cdn.ampproject.org/c/${secure}${u.host}${u.pathname}${u.search}`
  } catch {
    return ''
  }
}

const checked = [
  textField('Selector', 'link[rel~="amphtml" i]'), textField('Selection', 'First match'),
  textField('Calculation', 'Publisher subdomain of cdn.ampproject.org, /c/[s/]host/path?query, from the resolved amphtml href'),
  textField('Supported hostnames', 'Plain ASCII hostnames without a port; punycode/IDN and hostnames over 63 encoded characters are not calculable'),
]

export const ampCacheUrlRule: Rule = {
  id: 'google:amp-cache-url',
  name: 'AMP Cache URL',
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    userGuide: {
      check: "Calculates a Google AMP Cache address from the declared AMP URL for ordinary ASCII hostnames. A calculated address does not prove the page is cached, valid AMP or available.",
      action: "Use the source AMP URL to validate the page. If this calculator cannot handle the hostname or port, use the linked AMP cache URL tool; that limitation is not a website defect.",
    },
    provenance: 'standard',
    references: ['https://amp.dev/documentation/guides-and-tutorials/learn/amp-caches-and-cors/amp-cache-urls/'],
    description: 'Derives the Google AMP Cache URL (publisher subdomain of cdn.ampproject.org, /c/[s/]host/path?query) from the page\'s link rel=amphtml href.',
  },
  async run(page) {
    const amp = findAmp(page.doc)
    if (!amp.href) return presentResult(ampCacheUrlRule, page, {
      input: 'Idle DOM', label: 'HEAD', type: 'info', priority: 950,
      values: [textField('AMP Cache URL', 'Not applicable - no amphtml link')], checked,
      noMarkup: 'No matching amphtml link found',
    })

    const captured = markupEvidence([amp.element!], 'AMP link markup')
    const resolved = resolvePageWebUrl(amp.href, page)
    const declaredBase = page.doc.querySelector('base[href]')
    const baseHref = declaredBase?.getAttribute('href')?.trim() || ''
    const baseWasRead = Boolean(baseHref)
    const baseCapture = baseWasRead ? markupEvidence([declaredBase!], '<base>') : null
    const url = resolved ? ampCache(resolved) : ''
    const common = {
      input: 'Idle DOM', label: 'HEAD',
      detailValues: [resolved ? urlField('Declared amphtml href', amp.href) : textField('Declared amphtml href', amp.href),
        urlField('Page URL', page.url), baseWasRead ? urlField('Base href', baseHref) : textField('Base href', 'Not declared')],
      checked, evidence: [{ name: 'Match', fields: captured.fields }, ...(baseCapture ? [{ name: 'Base URL', fields: baseCapture.fields }] : [])],
      markup: [...captured.markup, ...(baseCapture ? baseCapture.markup : [])],
      noMarkup: 'Complete original amphtml source markup not retained',
    }
    if (url) return presentResult(ampCacheUrlRule, page, { ...common, type: 'info', priority: 700,
      values: [textField('AMP Cache URL', 'Derived'), urlField('Cache URL', url)] })
    if (resolved) return presentResult(ampCacheUrlRule, page, { ...common, type: 'info', priority: 400,
      values: [textField('AMP Cache URL', 'Not calculable for this hostname or port')] })
    return presentResult(ampCacheUrlRule, page, { ...common, type: 'warn', priority: 400,
      values: [textField('AMP Cache URL', 'Not applicable - amphtml href is not a valid HTTP(S) URL')] })
  },
}
