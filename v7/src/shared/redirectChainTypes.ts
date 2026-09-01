/**
 * Shared shape for HTTP redirect chains. Every rule that follows or reports
 * on redirects exposes this exact structure under `details.redirectChain`
 * so the UI can render the complete hop-by-hop chain, untruncated.
 */

export type RedirectHop = {
  url: string
  status: number
  /** Absolute redirect target (Location resolved against the hop URL). */
  location?: string
}

export type RedirectChain = {
  startUrl: string
  /** Every hop in order, including the final (non-redirect) response. */
  hops: RedirectHop[]
  finalUrl: string
  finalStatus: number
  redirectCount: number
  redirected: boolean
  /** A URL was seen twice while following - the chain never resolves. */
  loop: boolean
  loopUrl?: string
  /** The hop cap was hit; the chain continues beyond finalUrl. */
  capped: boolean
  maxHops: number
  /** Some hop redirected from https:// down to insecure http://. */
  httpDowngrade: boolean
  /** Runtime returned an opaqueredirect: intermediate hops are not visible. */
  hopsHidden: boolean
  note?: string
}

export type FollowOptions = {
  maxHops?: number
  timeoutMs?: number
  /** Return the final Response with its body intact (caller must consume it). */
  wantBody?: boolean
  fetchFn?: typeof fetch
  /** Hop observer override: null forces the plain fetch walk (Node/CLI path). */
  observer?: RedirectHopObserver | null
}

export type FollowResult = { chain: RedirectChain; response?: Response }

/** Thrown when a hop fetch fails or times out; carries the hops captured so far. */
export class RedirectChainError extends Error {
  readonly hops: RedirectHop[]

  constructor(message: string, hops: RedirectHop[]) {
    super(message)
    this.name = 'RedirectChainError'
    this.hops = hops
  }
}

/** What a runtime hop observer captured for one probe request. */
export type ObservedHops = {
  hops: RedirectHop[]
  /** True when a terminal event (completed/error) was seen before stop. */
  done: boolean
}

/**
 * Runtime-provided source of per-hop redirect data (chrome.webRequest in the
 * extension). When one is registered, followRedirectChain() fetches with
 * redirect:'follow' and reads the real hops from the observer instead of
 * fetch(), which hides them (opaqueredirect) in MV3.
 */
export type RedirectHopObserver = {
  start: (url: string) => Promise<string>
  stop: (id: string) => Promise<ObservedHops>
}
