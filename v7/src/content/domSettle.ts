export type SettleOutcome = 'quiet' | 'timeout' | 'aborted'
export type SettleOptions = { quietMs?: number; maxMs?: number; signal?: AbortSignal }

/** A route swap that stays silent this long is treated as rendered. */
export const DOM_QUIET_MS = 500
/** Never wait longer than this for a page that keeps mutating (carousels, timers). */
export const DOM_SETTLE_MAX_MS = 3_000

/**
 * Resolves 'quiet' once no DOM mutation happened for quietMs, 'timeout' after
 * maxMs at the latest, 'aborted' when the signal fires. The wait is bounded in
 * every branch; the observer is disconnected on every exit.
 */
export const waitForDomQuiet = (target: Node, { quietMs = DOM_QUIET_MS, maxMs = DOM_SETTLE_MAX_MS, signal }: SettleOptions = {}): Promise<SettleOutcome> =>
  new Promise((resolve) => {
    let quietTimer: ReturnType<typeof setTimeout> | undefined
    let maxTimer: ReturnType<typeof setTimeout> | undefined
    let observer: MutationObserver | undefined
    const onAbort = () => finish('aborted')
    const finish = (outcome: SettleOutcome) => {
      observer?.disconnect()
      clearTimeout(quietTimer)
      clearTimeout(maxTimer)
      signal?.removeEventListener('abort', onAbort)
      resolve(outcome)
    }
    if (signal?.aborted) {
      finish('aborted')
      return
    }
    const armQuiet = () => {
      clearTimeout(quietTimer)
      quietTimer = setTimeout(() => finish('quiet'), quietMs)
    }
    signal?.addEventListener('abort', onAbort, { once: true })
    observer = new MutationObserver(armQuiet)
    observer.observe(target, { childList: true, subtree: true, attributes: true, characterData: true })
    maxTimer = setTimeout(() => finish('timeout'), maxMs)
    armQuiet()
  })
