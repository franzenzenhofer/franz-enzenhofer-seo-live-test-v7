const alarmName = (tabId: number) => `finalize:${tabId}`

export const scheduleFinalize = async (tabId: number, inMs = 3000) => {
  await chrome.alarms.create(alarmName(tabId), { when: Date.now() + inMs })
}

export const onAlarm = (cb: (tabId: number) => void) => {
  chrome.alarms.onAlarm.addListener((a) => {
    if (a.name.startsWith('finalize:')) cb(Number(a.name.split(':')[1]))
  })
}

