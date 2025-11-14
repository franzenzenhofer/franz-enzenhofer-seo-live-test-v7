const isDevBuild = () => {
  try {
    return chrome.runtime.getManifest().name.includes('(Dev)')
  } catch {
    return false
  }
}

export const initDevAutoReload = () => {
  if (!isDevBuild()) return
  let last = ''
  const poll = async () => {
    try {
      const url = chrome.runtime.getURL('dev-reload.json') + `?ts=${Date.now()}`
      const res = await fetch(url, { cache: 'no-store' })
      if (res.ok) {
        const txt = await res.text()
        if (txt && last && txt !== last) {
          console.warn('[dev-reload] detected new build, reloading extension')
          chrome.runtime.reload()
          return
        }
        if (txt) last = txt
      }
    } catch {
      // Ignore network errors (file might not exist yet)
    }
    setTimeout(poll, 1500)
  }
  poll()
}
