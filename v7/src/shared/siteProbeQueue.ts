import { abortReason, throwIfAborted } from './abort'

type Waiter = { start: () => void; reject: (error: Error) => void }
type OriginState = { active: number; queue: Waiter[]; until: number }
const origins = new Map<string, OriginState>()
export const SITE_PROBE_CONCURRENCY = 2
const stateOf = (origin: string) => {
  const state = origins.get(origin) || { active: 0, queue: [], until: 0 }
  origins.set(origin, state)
  return state
}
const rateError = () => new Error('Origin probe cooldown: rate limited; remaining checks unavailable')

export const noteProbeResponse = (url: string, response: Response): void => {
  const retry = response.headers?.get?.('retry-after')
  if (response.status !== 429 && !(response.status === 503 && retry)) return
  const delay = retry && /^\d+$/.test(retry) ? Number(retry) * 1_000 : Date.parse(retry || '') - Date.now()
  const state = stateOf(new URL(url).origin)
  state.until = Math.max(state.until, Date.now() + (Number.isFinite(delay) ? Math.max(60_000, delay) : 60_000))
  state.queue.splice(0).forEach((waiter) => waiter.reject(rateError()))
}

export const withSiteProbe = async <T>(url: string, signal: AbortSignal | undefined, run: () => Promise<T>): Promise<T> => {
  throwIfAborted(signal)
  const origin = new URL(url).origin
  if (!/^https?:$/.test(new URL(url).protocol)) throw new Error('Only HTTP(S) probes are supported')
  for (const [key, value] of origins) {
    if (!value.active && !value.queue.length && value.until <= Date.now()) origins.delete(key)
  }
  const state = stateOf(origin)
  if (state.until > Date.now()) throw rateError()
  let abort: (() => void) | undefined
  try {
    await new Promise<void>((resolve, reject) => {
      const waiter = { start: () => { state.active++; resolve() }, reject }
      abort = () => {
        const index = state.queue.indexOf(waiter)
        if (index >= 0) state.queue.splice(index, 1)
        reject(signal ? abortReason(signal) : new Error('Cancelled'))
      }
      if (state.active < SITE_PROBE_CONCURRENCY) waiter.start()
      else { state.queue.push(waiter); signal?.addEventListener('abort', abort, { once: true }) }
    })
  } finally { if (abort) signal?.removeEventListener('abort', abort) }
  try { throwIfAborted(signal); return await run() }
  finally {
    state.active--
    if (state.until <= Date.now()) state.queue.shift()?.start()
    if (!state.active && !state.queue.length && state.until <= Date.now()) origins.delete(origin)
  }
}
