const alarmName = (tabId: number) => `finalize:${tabId}`

export const scheduleFinalize = async (tabId: number, inMs = 3000) => {
  const name = alarmName(tabId)
  try { await chrome.alarms.clear(name) } catch { /* ignore */ }
  await chrome.alarms.create(name, { when: Date.now() + inMs })
}

export const clearFinalize = async (tabId: number) => {
  const name = alarmName(tabId)
  try { await chrome.alarms.clear(name) } catch { /* ignore */ }
}

export const onAlarm = (cb: (tabId: number) => void) => {
  chrome.alarms.onAlarm.addListener((a) => {
    if (a.name.startsWith('finalize:')) cb(Number(a.name.split(':')[1]))
  })
}
