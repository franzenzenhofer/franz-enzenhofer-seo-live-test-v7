import type { Result, Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'
import { followRedirectChain } from '@/shared/redirectChain'
import { redirectChainDetails } from '@/shared/redirectChainFormat'
import { RedirectChainError } from '@/shared/redirectChainTypes'
import type { RedirectChain } from '@/shared/redirectChainTypes'

const LABEL = 'HTTP'
const NAME = 'Soft 404 Probe'
const RULE_ID = 'http:soft-404'
const SPEC = 'https://support.google.com/webmasters/answer/181708?hl=en'

const buildProbeUrl = (rawUrl: string): string => {
  const u = new URL(rawUrl)
  u.search = ''
  u.hash = ''
  const basePath = u.pathname.replace(/\/[^/]*$/, '')
  const dir = basePath || '/'
  const slug = `fake-url-for-soft-404-error-check-${Math.floor(Math.random() * 100000000000)}`
  u.pathname = `${dir.replace(/\/$/, '')}/${slug}`
  return u.toString()
}

/** " after 2 redirects" / " after redirect(s)" (count not observable) / "". */
const redirectPhrase = (chain: RedirectChain): string => {
  if (!chain.redirected) return ''
  if (chain.hopsHidden) return ' after redirect(s)'
  return ` after ${chain.redirectCount} redirect${chain.redirectCount === 1 ? '' : 's'}`
}

const verdict = (chain: RedirectChain): Pick<Result, 'message' | 'type' | 'priority'> => {
  const status = chain.finalStatus
  const after = redirectPhrase(chain)
  if (chain.loop || chain.capped) {
    const what = chain.loop ? 'loops' : `exceeds the ${chain.maxHops}-hop cap`
    return { message: `Non-existing URL probe never resolved: the redirect chain ${what}.`, type: 'error', priority: 40 }
  }
  if (status === 404 && !chain.redirected) {
    return { message: 'Non-existing URL returned HTTP 404 (expected).', type: 'ok', priority: 900 }
  }
  if (status === 410) {
    return { message: `Non-existing URL returned HTTP 410${after} (should be 404).`, type: 'warn', priority: 150 }
  }
  if (status === 200) {
    return { message: `Soft 404: Non-existing URL returned HTTP 200${after} (should be 404).`, type: 'error', priority: 50 }
  }
  if (status === 404) {
    return { message: `Non-existing URL returned HTTP 404${after} (should be direct 404).`, type: 'warn', priority: 250 }
  }
  return { message: `Soft 404: Non-existing URL returned HTTP ${status}${after} (should be 404).`, type: 'error', priority: 120 }
}

export const soft404Rule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  async run(page) {
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)
    let probeUrl: string
    try {
      probeUrl = buildProbeUrl(page.url)
    } catch {
      return {
        label: LABEL,
        name: NAME,
        message: 'Cannot build probe URL for soft 404 check.',
        type: 'runtime_error',
        priority: 10,
        details: { url: page.url, reference: SPEC },
      }
    }

    try {
      const { chain } = await followRedirectChain(probeUrl)
      const status = chain.finalStatus
      const { finalUrl, redirected } = chain
      const snippet = extractSnippet(`${status} ${finalUrl}`, 200)
      // Short verdict + measurements; the full hop-by-hop chain lives in details.
      const base = verdict(chain)
      return {
        label: LABEL,
        name: NAME,
        message: base.message,
        type: base.type,
        priority: base.priority,
        details: {
          probeUrl, finalUrl, status, redirected, redirectCount: chain.redirectCount,
          ...redirectChainDetails(chain),
          snippet, reference: SPEC,
        },
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const hops = error instanceof RedirectChainError ? error.hops : []
      return {
        label: LABEL,
        name: NAME,
        message: `Soft 404 probe failed: ${message}`,
        type: 'runtime_error',
        priority: 5,
        details: {
          url: page.url, probeUrl, reference: SPEC,
          ...(hops.length ? { redirectChainHops: hops } : {}),
        },
      }
    }
  },
}
