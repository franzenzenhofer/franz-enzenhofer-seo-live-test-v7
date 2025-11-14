import { Logger } from '@/shared/logger'

const url = 'src/offscreen.html'

const hasOffscreenSupport = () => Boolean(chrome.offscreen?.createDocument)

export const ensureOffscreen = async (tabId: number): Promise<boolean> => {
  if (!hasOffscreenSupport()) {
    await Logger.logDirect(tabId, 'offscreen', 'no API support', {})
    return false
  }
  const has = await chrome.offscreen?.hasDocument?.()
  if (has) {
    await Logger.logDirect(tabId, 'offscreen', 'doc exists', {})
    return true
  }
  await Logger.logDirect(tabId, 'offscreen', 'create doc', { url })
  await chrome.offscreen?.createDocument({
    url,
    reasons: [chrome.offscreen.Reason.DOM_PARSER],
    justification: 'Run rules asynchronously in isolated doc',
  })
  await Logger.logDirect(tabId, 'offscreen', 'doc created', {})
  return true
}

export const runInOffscreen = async <T>(tabId: number, payload: unknown): Promise<T> => {
  await Logger.logDirect(tabId, 'offscreen', 'call start', {})
  const ok = await ensureOffscreen(tabId)
  if (!ok) {
    await Logger.logDirect(tabId, 'offscreen', 'ensure failed', {})
    throw new Error('offscreen-unavailable')
  }
  await Logger.logDirect(tabId, 'offscreen', 'send message', {})
  return new Promise((resolve, reject) => {
    const id = Math.random().toString(36).slice(2)
    const timeout = setTimeout(() => {
      chrome.runtime.onMessage.removeListener(onMsg)
      Logger.logDirect(tabId, 'offscreen', 'TIMEOUT', { id })
      reject(new Error('offscreen-timeout'))
    }, 15000)
    function onMsg(msg: unknown) {
      const m = msg as { channel?: string; replyTo?: string; data?: unknown }
      if (m?.channel === 'offscreen' && m?.replyTo === id) {
        clearTimeout(timeout)
        chrome.runtime.onMessage.removeListener(onMsg)
        Logger.logDirect(tabId, 'offscreen', 'got response', { id })
        resolve(m.data as T)
      }
    }
    chrome.runtime.onMessage.addListener(onMsg)
    chrome.runtime.sendMessage({ channel: 'offscreen', id, data: payload }).catch((err) => {
      clearTimeout(timeout)
      chrome.runtime.onMessage.removeListener(onMsg)
      Logger.logDirect(tabId, 'offscreen', 'send failed', { error: String(err) })
      reject(new Error('offscreen-message-failed'))
    })
  })
}
