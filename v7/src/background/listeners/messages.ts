import { pushEvent, markDomPhase } from '../pipeline/collector'
import { setDomDone } from '../pipeline/store'
import { scheduleFinalize } from '../pipeline/alarms'

type Sender = chrome.runtime.MessageSender

export const handleMessage = (msg: unknown, sender: Sender, send?: (resp?: unknown) => void) => {
  const st = msg as { event?: string; data?: unknown; type?: string; tabId?: number } | null
  const tabId = st?.tabId || sender.tab?.id || null
  if (st?.type === 'panel:runNow' && tabId) {
    setDomDone(tabId).then(() => scheduleFinalize(tabId, 0)).then(() => send?.('ok')).catch(() => send?.('err'))
    return true
  }
  if (st?.event && tabId) {
    pushEvent(tabId, { t: `dom:${st.event}`, d: st.data })
    if (st.event === 'document_idle') markDomPhase(tabId)
  }
  if (msg === 'tabIdPls' && tabId) send?.({ tabId, url: sender.tab?.url })
  return true
}

export const registerMessageListeners = () => {
  chrome.runtime.onMessage.addListener((msg, sender, send) => handleMessage(msg, sender, send))
}
