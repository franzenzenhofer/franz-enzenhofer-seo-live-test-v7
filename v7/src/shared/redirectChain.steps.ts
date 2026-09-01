import { discardBody } from './http-utils'
import { RedirectChainError } from './redirectChainTypes'
import type { FollowResult, RedirectChain, RedirectHop } from './redirectChainTypes'

const HIDDEN_HOPS_NOTE =
  'This runtime hides intermediate redirect responses (opaqueredirect), so per-hop statuses and Location targets '
  + 'are not observable from fetch(). Only the final response of the followed chain is shown.'

export const newChain = (startUrl: string, maxHops: number): RedirectChain => ({
  startUrl, hops: [], finalUrl: startUrl, finalStatus: 0, redirectCount: 0,
  redirected: false, loop: false, capped: false, maxHops, httpDowngrade: false, hopsHidden: false,
})

/** One manual-redirect fetch; failures carry the hops captured so far. */
export const hopFetch = async (
  fetchFn: typeof fetch, url: string, signal: AbortSignal, timeoutMs: number, hops: RedirectHop[],
): Promise<Response> => {
  try {
    return await fetchFn(url, { redirect: 'manual', signal })
  } catch (error) {
    const captured = `${hops.length} hop${hops.length === 1 ? '' : 's'} captured before failure`
    if (signal.aborted) {
      throw new RedirectChainError(`Redirect chain timed out after ${timeoutMs / 1000}s at ${url} (${captured})`, hops)
    }
    const msg = error instanceof Error ? error.message : String(error)
    throw new RedirectChainError(`Redirect chain fetch failed at ${url}: ${msg} (${captured})`, hops)
  }
}

export const finalize = (chain: RedirectChain, url: string, res: Response, wantBody?: boolean): FollowResult => {
  chain.hops.push({ url, status: res.status })
  chain.finalUrl = res.url || url
  chain.finalStatus = res.status
  if (wantBody) return { chain, response: res }
  discardBody(res)
  return { chain }
}

/** Opaqueredirect fallback: the runtime refuses to show hops - say so loudly. */
export const followHidden = async (
  chain: RedirectChain, url: string, fetchFn: typeof fetch, signal: AbortSignal, wantBody?: boolean,
): Promise<FollowResult> => {
  const res = await fetchFn(url, { redirect: 'follow', signal })
  chain.hopsHidden = true
  chain.redirected = true
  chain.note = HIDDEN_HOPS_NOTE
  return finalize(chain, res.url || url, res, wantBody)
}

export const stopWithNote = (chain: RedirectChain, url: string, status: number, note: string): FollowResult => {
  chain.hops.push({ url, status })
  chain.finalUrl = url
  chain.note = note
  return { chain }
}
