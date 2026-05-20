const DEV_RELOAD_ALARM = 'dev:auto-reload'

const isDevBuild = () => {
  try {
    return chrome.runtime.getManifest().name.includes('(Dev)')
  } catch {
    return false
  }
}

let lastTxt = ''

const poll = async (): Promise<void> => {
  try {
    const url = chrome.runtime.getURL('dev-reload.json') + `?ts=${Date.now()}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return
    const txt = await res.text()
    if (txt && lastTxt && txt !== lastTxt) {
      console.warn('[dev-reload] detected new build, reloading extension')
      chrome.runtime.reload()
      return
    }
    if (txt) lastTxt = txt
  } catch {
    // Ignore network errors (file might not exist yet)
  }
}

export const initDevAutoReload = (): void => {
  if (!isDevBuild()) return
  // chrome.alarms minimum period is 0.025 min (1.5 s). Use that so the dev
  // poll cadence stays identical to the legacy setTimeout(poll, 1500) loop
  // without keeping the service worker permanently awake.
  chrome.alarms.create(DEV_RELOAD_ALARM, { periodInMinutes: 0.025 })
  chrome.alarms.onAlarm.addListener((a) => {
    if (a.name === DEV_RELOAD_ALARM) void poll()
  })
  void poll()
}
