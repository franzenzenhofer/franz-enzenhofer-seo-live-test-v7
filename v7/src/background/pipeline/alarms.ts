const alarmName = (tabId: number) => `finalize:${tabId}`

// Packed (Chrome Web Store) builds clamp chrome.alarms so a `when` in the near
// future "won't actually cause the alarm to fire for at least 30 seconds";
// only unpacked builds are exempt, which hides the stall in development.
// https://developer.chrome.com/docs/extensions/reference/api/alarms
// The in-process timer fires at the requested delay; the alarm stays armed as
// the watchdog for the case where the service worker dies before the timer
// runs. finalizeTab is idempotent (peek/pop-once), so a double fire is a no-op.
type FinalizeCallback = (tabId: number) => void | Promise<void>
let fire: FinalizeCallback | null = null
const timers = new Map<number, ReturnType<typeof setTimeout>>()

const clearTimer = (tabId: number) => {
  const timer = timers.get(tabId)
  if (timer === undefined) return
  clearTimeout(timer)
  timers.delete(tabId)
}

export const scheduleFinalize = async (tabId: number, inMs = 3000) => {
  const name = alarmName(tabId)
  try { await chrome.alarms.clear(name) } catch { /* ignore */ }
  clearTimer(tabId)
  timers.set(tabId, setTimeout(() => {
    timers.delete(tabId)
    // The timer handled it; drop the watchdog so it cannot fire a second
    // finalize against events accumulating for the NEXT run.
    try { Promise.resolve(chrome.alarms.clear(name)).catch(() => {}) } catch { /* ignore */ }
    fire?.(tabId)
  }, inMs))
  await chrome.alarms.create(name, { when: Date.now() + inMs })
}

export const clearFinalize = async (tabId: number) => {
  clearTimer(tabId)
  try { await chrome.alarms.clear(alarmName(tabId)) } catch { /* ignore */ }
}

export const onAlarm = (cb: FinalizeCallback) => {
  fire = cb
  chrome.alarms.onAlarm.addListener((a) => {
    if (!a.name.startsWith('finalize:')) return
    const tabId = Number(a.name.split(':')[1])
    clearTimer(tabId)
    cb(tabId)
  })
}
