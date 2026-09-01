import type { RedirectHopObserver } from './redirectChainTypes'

/**
 * Process-wide hop observer registry. The extension's offscreen document
 * registers a webRequest-backed observer at startup; Node/CLI never does,
 * so followRedirectChain() keeps its plain fetch walk there.
 */
let registered: RedirectHopObserver | null = null

export const setRedirectHopObserver = (observer: RedirectHopObserver | null): void => {
  registered = observer
}

export const getRedirectHopObserver = (): RedirectHopObserver | null => registered
