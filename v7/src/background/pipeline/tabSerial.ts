/**
 * Serializes async mutations per tab. chrome.storage read-modify-write is not
 * atomic: webRequest bursts, phase-result chunks and markDomPhase all call
 * into the run store concurrently (their callers do not await), and two
 * interleaved get/set pairs silently drop whichever write lands first.
 */
const chains = new Map<number, Promise<unknown>>()

export const serializePerTab = <T>(tabId: number, task: () => Promise<T>): Promise<T> => {
  const prev = chains.get(tabId) ?? Promise.resolve()
  const next = prev.then(task, task)
  chains.set(tabId, next.then(() => undefined, () => undefined))
  return next
}
