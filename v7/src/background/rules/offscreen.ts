const url = 'src/offscreen.html'

const hasOffscreenSupport = () => Boolean(chrome.offscreen?.createDocument)

export const ensureOffscreen = async (): Promise<boolean> => {
  if (!hasOffscreenSupport()) return false
  try {
    const has = await chrome.offscreen?.hasDocument?.()
    if (has) return true
    await chrome.offscreen?.createDocument({
      url,
      reasons: [chrome.offscreen.Reason.DOM_PARSER],
      justification: 'Run rules asynchronously in isolated doc',
    })
    return true
  } catch {
    return false
  }
}

export const runInOffscreen = async <T>(payload: unknown): Promise<T> => {
  const ok = await ensureOffscreen()
  if (!ok) throw new Error('offscreen-unavailable')
  return new Promise((resolve, reject) => {
    const id = Math.random().toString(36).slice(2)
    const timeout = setTimeout(() => {
      chrome.runtime.onMessage.removeListener(onMsg)
      reject(new Error('offscreen-timeout'))
    }, 15000)
    function onMsg(msg: unknown) {
      const m = msg as { channel?: string; replyTo?: string; data?: unknown }
      if (m?.channel === 'offscreen' && m?.replyTo === id) {
        clearTimeout(timeout)
        chrome.runtime.onMessage.removeListener(onMsg)
        resolve(m.data as T)
      }
    }
    chrome.runtime.onMessage.addListener(onMsg)
    chrome.runtime.sendMessage({ channel: 'offscreen', id, data: payload }).catch(() => {})
  })
}
