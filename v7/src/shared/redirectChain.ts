import { followChain, REDIRECT_MAX_HOPS, REDIRECT_TIMEOUT_MS } from './redirectChain.walk'
import { withSiteProbe } from './siteProbeQueue'
import type { FollowOptions, FollowResult } from './redirectChainTypes'

export { REDIRECT_MAX_HOPS, REDIRECT_TIMEOUT_MS }

/**
 * Public entry point: the whole hop walk holds one per-origin probe slot.
 * The final body is NOT read here - a caller that asks for `wantBody` still
 * decides from the status whether it needs it, and reads it with
 * `readResponseText` (bounded); anything it does not read it cancels. Reading
 * bodies the caller throws away would spend a stranger's bandwidth for nothing.
 */
export const followRedirectChain = (url: string, opts: FollowOptions = {}): Promise<FollowResult> =>
  withSiteProbe(url, opts.signal, () => followChain(url, opts))
