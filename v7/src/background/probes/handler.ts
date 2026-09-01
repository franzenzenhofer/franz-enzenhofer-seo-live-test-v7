import { syncProbeListeners } from './listeners'
import { createProbe, finishProbe, getProbe, removeProbe } from './state'

// Bounded like the offscreen controllers: a probe whose owner never stops it
// (crashed offscreen document) is purged, its listeners released.
const PROBE_LIFETIME_MS = 60_000
// Redirect events always precede the follow fetch resolving, but their IPC
// delivery can trail the stop message - wait briefly for the terminal event.
const STOP_GRACE_MS = 3_000

export type ProbeChainMessage = { op?: string; url?: string; id?: string }
type Send = (response?: unknown) => void

const respondAndDrop = (id: string, send: Send): void => {
  const record = getProbe(id)
  if (!record) {
    send({ error: 'probe-not-found' })
    return
  }
  send({ hops: record.hops, done: record.done })
  removeProbe(id)
  syncProbeListeners()
}

const handleStart = (url: string, send: Send): void => {
  const record = createProbe(url, PROBE_LIFETIME_MS, (expired) => {
    finishProbe(expired)
    removeProbe(expired.id)
    syncProbeListeners()
  })
  syncProbeListeners()
  send({ id: record.id })
}

/**
 * Serves probe hop observation for the offscreen document over the existing
 * offscreen runtime-message channel. `start` arms the shared webRequest
 * listeners before the probe fetch begins; `stop` returns the captured hops
 * (waiting up to STOP_GRACE_MS for the terminal event) and releases the
 * probe. Returns true when the response is sent asynchronously.
 */
export const handleProbeChainMessage = (msg: ProbeChainMessage, send?: Send): boolean => {
  if (!send) return false
  if (msg.op === 'start' && typeof msg.url === 'string' && msg.url) {
    handleStart(msg.url, send)
    return false
  }
  if (msg.op === 'stop' && typeof msg.id === 'string') {
    const id = msg.id
    const record = getProbe(id)
    if (!record || record.done) {
      respondAndDrop(id, send)
      return false
    }
    const timer = setTimeout(() => respondAndDrop(id, send), STOP_GRACE_MS)
    record.waiters.push(() => {
      clearTimeout(timer)
      respondAndDrop(id, send)
    })
    return true
  }
  send({ error: 'probe-bad-request' })
  return false
}
