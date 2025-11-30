import type { Rule } from '@/core/types'

const LABEL = 'URL'
const NAME = 'URL trailing slash consistency'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'
const TESTED = 'Fetched opposite trailing-slash variant, checked redirects and canonical alignment.'

const normalize = (u: string) => {
  try {
    const url = new URL(u)
    url.hash = ''
    return url.href
  } catch {
    return u
  }
}

const buildVariant = (raw: string) => {
  const url = new URL(raw)
  url.search = ''
  url.hash = ''
  const hasSlash = url.pathname.endsWith('/') && url.pathname.length > 1
  const variantPath = hasSlash ? url.pathname.replace(/\/$/, '') : `${url.pathname}/`
  url.pathname = variantPath
  const [withoutHash] = raw.split('#')
  const [clean] = (withoutHash || raw).split('?')
  const original = clean || raw
  return { originalUrl: new URL(original).toString(), variantUrl: url.toString(), hasSlash }
}

export const trailingSlashRule: Rule = {
  id: 'url:trailing-slash',
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    let originalUrl: string; let variantUrl: string; let hasSlash = false
    try { ({ originalUrl, variantUrl, hasSlash } = buildVariant(page.url)) } catch {
      return { label: LABEL, message: 'Invalid URL. Cannot evaluate trailing slash.', type: 'runtime_error', name: NAME, priority: 50, details: { tested: TESTED, url: page.url, reference: SPEC } }
    }

    if (new URL(originalUrl).pathname === '/') {
      return { label: LABEL, message: 'Root path - trailing slash check not applicable.', type: 'info', name: NAME, priority: 900, details: { tested: TESTED, originalUrl, reference: SPEC } }
    }

    const whatCase = hasSlash ? 'without' : 'with'
    const opposite = hasSlash ? 'with' : 'without'

    try {
      const res = await fetch(variantUrl, { redirect: 'follow' })
      const status = res.status
      const finalUrl = res.url || variantUrl
      const redirected = res.redirected
      const baseDetails = { tested: TESTED, originalUrl, variantUrl, finalUrl, status, redirected, reference: SPEC }

      if (status !== 200) {
        const type = status === 404 ? 'info' : status === 410 ? 'warn' : status === 302 || status >= 500 ? 'error' : 'warn'
        return {
          label: LABEL,
          message: `URL variant ${whatCase} trailing slash ${variantUrl} returns HTTP ${status}.`,
          type,
          name: NAME,
          priority: type === 'error' ? 150 : 400,
          details: baseDetails,
        }
      }

      if (redirected) {
        const matchesOriginal = normalize(finalUrl) === normalize(originalUrl)
        return {
          label: LABEL,
          message: matchesOriginal
            ? `URL variant ${whatCase} trailing slash redirects to ${opposite} version (OK).`
            : `URL variant ${whatCase} trailing slash redirects to ${finalUrl} (unexpected).`,
          type: matchesOriginal ? 'info' : 'error',
          name: NAME,
          priority: matchesOriginal ? 800 : 120,
          details: { ...baseDetails, matchesOriginal },
        }
      }

      const body = await res.text()
      const doc = new DOMParser().parseFromString(body, 'text/html')
      const canonicalHref = doc.querySelector('link[rel~="canonical" i]')?.getAttribute('href') || ''
      if (!canonicalHref) {
        return {
          label: LABEL,
          message: `URL variant ${whatCase} trailing slash returned 200 but no canonical found.`,
          type: 'error',
          name: NAME,
          priority: 140,
          details: { ...baseDetails, canonicalHref: null, snippet: body.slice(0, 500) },
        }
      }

      let resolvedCanonical = ''
      try {
        resolvedCanonical = new URL(canonicalHref, variantUrl).href
      } catch {
        return {
          label: LABEL,
          message: `URL variant ${whatCase} trailing slash has invalid canonical.`,
          type: 'error',
          name: NAME,
          priority: 140,
          details: { ...baseDetails, canonicalHref, snippet: body.slice(0, 500) },
        }
      }

      const matchesOriginal = normalize(resolvedCanonical) === normalize(originalUrl)
      const matchesVariant = normalize(resolvedCanonical) === normalize(variantUrl)

      if (!matchesOriginal && !matchesVariant) {
        return {
          label: LABEL,
          message: `URL variant ${whatCase} trailing slash canonical points to ${resolvedCanonical} (unexpected).`,
          type: 'error',
          name: NAME,
          priority: 130,
          details: { ...baseDetails, canonicalHref: resolvedCanonical, matchesOriginal, matchesVariant, snippet: body.slice(0, 500) },
        }
      }

      if (matchesOriginal) {
        return {
          label: LABEL,
          message: `URL variant ${whatCase} trailing slash canonical points back to ${opposite} version (OK).`,
          type: 'info',
          name: NAME,
          priority: 850,
          details: { ...baseDetails, canonicalHref: resolvedCanonical, matchesOriginal, matchesVariant, snippet: body.slice(0, 500) },
        }
      }

      return {
        label: LABEL,
        message: `URL variant ${whatCase} trailing slash canonical points to this variant (currently not canonical).`,
        type: 'warn',
        name: NAME,
        priority: 300,
        details: { ...baseDetails, canonicalHref: resolvedCanonical, matchesOriginal, matchesVariant, snippet: body.slice(0, 500) },
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      return { label: LABEL, message: `Trailing slash probe failed: ${msg}`, type: 'runtime_error', name: NAME, priority: 10, details: { tested: TESTED, originalUrl, variantUrl, reference: SPEC } }
    }
  },
}
