import { isRedirectStatus } from './http-constants'
import { newChain } from './redirectChain.steps'
import type { RedirectChain } from './redirectChainTypes'

/** Shape of `page.headerChain` hops (main-document webRequest events). */
type HeaderChainHop = {
  url: string
  status?: number
  location?: string
  redirectUrl?: string
}

const resolveTarget = (hop: HeaderChainHop): string | undefined => {
  const raw = hop.redirectUrl || hop.location
  if (!raw) return undefined
  try {
    return new URL(raw, hop.url).toString()
  } catch {
    return raw
  }
}

/**
 * Builds the shared RedirectChain shape from the main document's webRequest
 * hop chain (`page.headerChain`), so main-frame navigation chains and probe
 * chains render identically. Returns null when no hops were captured.
 */
export const headerChainToRedirectChain = (
  headerChain: readonly HeaderChainHop[] | undefined,
  fallbackStatus?: number,
): RedirectChain | null => {
  const first = headerChain?.[0]
  if (!headerChain || !first) return null
  const chain = newChain(first.url, headerChain.length)
  const seen = new Set<string>()
  for (const hop of headerChain) {
    const status = hop.status ?? 0
    const location = resolveTarget(hop)
    const isRedirect = isRedirectStatus(status) || (status === 0 && !!location)
    chain.hops.push({ url: hop.url, status, ...(location ? { location } : {}) })
    if (isRedirect) {
      chain.redirectCount += 1
      chain.redirected = true
    }
    if (location && hop.url.startsWith('https:') && location.startsWith('http:')) chain.httpDowngrade = true
    if (seen.has(hop.url)) {
      chain.loop = true
      chain.loopUrl = hop.url
    }
    seen.add(hop.url)
  }
  const last = chain.hops[chain.hops.length - 1]
  if (!last) return null
  const lastIsRedirect = isRedirectStatus(last.status) || (last.status === 0 && !!last.location)
  chain.finalUrl = lastIsRedirect && last.location ? last.location : last.url
  chain.finalStatus = lastIsRedirect ? fallbackStatus ?? 0 : last.status || fallbackStatus || 0
  return chain
}
