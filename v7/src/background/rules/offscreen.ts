const url = 'src/offscreen.html'

export const ensureOffscreen = async () => {
  const has = await chrome.offscreen.hasDocument?.()
  if (has) return
  await chrome.offscreen.createDocument({
    url,
    // @ts-expect-error type lag in @types/chrome
    reasons: ['IFRAME_SCRIPTING'],
    justification: 'Run rules asynchronously in isolated doc',
  })
}

export const runInOffscreen = async <T>(payload: unknown): Promise<T> => {
  await ensureOffscreen()
  return new Promise((resolve) => {
    const id = Math.random().toString(36).slice(2)
    const onMsg = (msg: unknown) => {
      const m = msg as { channel?: string; replyTo?: string; data?: unknown }
      if (m?.channel === 'offscreen' && m?.replyTo === id) {
        chrome.runtime.onMessage.removeListener(onMsg)
        resolve(m.data as T)
      }
    }
    chrome.runtime.onMessage.addListener(onMsg)
    chrome.runtime.sendMessage({ channel: 'offscreen', id, data: payload })
  })
}
