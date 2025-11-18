import { ensureOffscreenDocument } from './offscreenDoc'

import { Logger } from '@/shared/logger'

const DEFAULT_TIMEOUT_MS = 15000

export const runInOffscreen = async <T>(
  tabId: number,
  payload: unknown,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  onChunk?: (chunk: unknown) => void,
  options: { signal?: AbortSignal } = {},
): Promise<T> => {
  await Logger.logDirect(tabId, 'offscreen', 'call start', { timeoutMs })
  const ok = await ensureOffscreenDocument(tabId)
  if (!ok) {
    await Logger.logDirect(tabId, 'offscreen', 'ensure failed', {})
    throw new Error('offscreen-unavailable')
  }
  await Logger.logDirect(tabId, 'offscreen', 'send message', {})
  return new Promise((resolve, reject) => {
    const id = Math.random().toString(36).slice(2)
    let settled = false
    const cleanup = () => {
      clearTimeout(timeout)
      chrome.runtime.onMessage.removeListener(onMsg)
      options.signal?.removeEventListener('abort', onAbort)
    }
    const fail = (error: Error) => {
      if (settled) return
      settled = true
      cleanup()
      reject(error)
    }
    const requestCancel = (reason: string) => {
      Logger.logDirect(tabId, 'offscreen', 'cancel', { id, reason })
      chrome.runtime.sendMessage({ channel: 'offscreen', control: 'cancel', target: id, tabId }).catch(() => {})
    }
    const onAbort = () => {
      requestCancel('signal')
      fail(new Error('offscreen-run-cancelled'))
    }
    if (options.signal?.aborted) return onAbort()
    options.signal?.addEventListener('abort', onAbort, { once: true })
    const timeout = setTimeout(() => {
      requestCancel('timeout')
      fail(new Error('offscreen-timeout'))
    }, timeoutMs)
    function onMsg(msg: unknown) {
      const m = msg as { channel?: string; replyTo?: string; data?: unknown; chunk?: boolean; error?: string }
      if (m?.channel === 'offscreen' && m?.replyTo === id) {
        if (m.chunk) {
          if (!settled) onChunk?.(m.data)
          return
        }
        settled = true
        cleanup()
        Logger.logDirect(tabId, 'offscreen', 'got response', { id })
        if (m.error) {
          reject(new Error(m.error))
          return
        }
        resolve(m.data as T)
      }
    }
    chrome.runtime.onMessage.addListener(onMsg)
    chrome.runtime.sendMessage({ channel: 'offscreen', id, tabId, data: payload }).catch((err) => {
      cleanup()
      Logger.logDirect(tabId, 'offscreen', 'send failed', { error: String(err) })
      reject(new Error('offscreen-message-failed'))
    })
  })
}
