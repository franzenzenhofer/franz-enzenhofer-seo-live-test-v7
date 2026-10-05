import { urlOrText } from './failureReason'

import { overviewMarkup } from '@/rules/discover/discoverPresentation'
import { resolvePageWebUrl } from '@/shared/resolvePageWebUrl'
import type { Rule } from '@/core/types'
import { textField, urlField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
import { presentResult } from '@/shared/presentation/result'
import type { DisplayField } from '@/shared/presentation/schema'
import { isAbsoluteUrl } from '@/shared/url-utils'

const SELECTOR = 'link[rel~="amphtml" i]'

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
  textField('Selector', SELECTOR), textField('Selection', 'First match'),
  textField('Calculation', 'Publisher subdomain of cdn.ampproject.org, /c/[s/]host/path?query, from the resolved amphtml href'),
  textField('Supported hostnames', 'Plain ASCII hostnames without a port; punycode/IDN and hostnames over 63 encoded characters are not calculable'),
]
const hrefOf = (element: Element) => (element.getAttribute('href') || '').trim()
// The raw href is shown only when it is not already the absolute URL shown as amphtml URL (FORMATTING.md F11).
const hrefRow = (href: string, resolved: string | null): DisplayField[] => href === resolved || isAbsoluteUrl(href) ? [] : [textField('amphtml href', href)]

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
    const element = page.doc.querySelector(SELECTOR)
    const href = element?.getAttribute('href') || ''
    if (!href) return presentResult(ampCacheUrlRule, page, {
      input: 'Idle DOM', label: 'HEAD', type: 'info', priority: 950,
      values: [textField('amphtml link', 'Not found')], checked,
      noMarkup: 'No matching amphtml link found',
    })

    const resolved = resolvePageWebUrl(href, page)
    const declaredBase = page.doc.querySelector('base[href]')
    const baseHref = declaredBase?.getAttribute('href')?.trim() || ''
    // The base element is inspected only when it was actually read to resolve the declaration.
    const elements = baseHref ? [element!, declaredBase!] : [element!]
    const records = elementRecords(elements, elements.length, (inspected) => [urlOrText('href', hrefOf(inspected))])
    const cacheUrl = resolved ? ampCache(resolved) : ''
    const observed = [...hrefRow(href, resolved), ...(resolved ? [urlField('amphtml URL', resolved)] : [])]
    const common = {
      input: 'Idle DOM', label: 'HEAD',
      detailValues: [baseHref ? urlOrText('Base href', baseHref) : textField('Base href', 'Not declared'), ...records.counts],
      checked, evidence: records.evidence, markup: records.markup,
      noMarkup: 'Complete original amphtml source markup not retained',
    }
    if (cacheUrl) return presentResult(ampCacheUrlRule, page, { ...common, type: 'info', priority: 700,
      values: [...observed, urlField('AMP Cache URL', cacheUrl), ...overviewMarkup(records.markup)] })
    // Unsupported hostname or port (info) and an unresolvable href (warn) both leave the cache URL unchecked.
    return presentResult(ampCacheUrlRule, page, { ...common, type: resolved ? 'info' : 'warn', priority: 400,
      values: [...observed, textField('AMP Cache URL', 'Not checked'), ...overviewMarkup(records.markup)] })
  },
}
