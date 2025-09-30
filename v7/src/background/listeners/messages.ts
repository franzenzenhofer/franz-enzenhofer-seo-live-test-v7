import { pushEvent, markDomPhase } from '../pipeline/collector'
import { setDomDone } from '../pipeline/store'
import { scheduleFinalize } from '../pipeline/alarms'

type Sender = chrome.runtime.MessageSender

export const handleMessage = (msg: unknown, sender: Sender, send?: (resp?: unknown) => void) => {
  const st = msg as { event?: string; data?: unknown; type?: string; tabId?: number } | null
  const tabId = st?.tabId || sender.tab?.id || null
  if (st?.type === 'panel:runNow' && tabId) {
    ;(async ()=>{
      try {
        // Clear results if autoClear enabled
        const v = await chrome.storage.local.get('ui:autoClear')
        if (v['ui:autoClear'] !== false) await chrome.storage.local.remove(`results:${tabId}`)

        // Get current tab to capture URL
        const tab = await chrome.tabs.get(tabId)
        if (tab.url) {
          // Push nav event with current URL
          await pushEvent(tabId, { t: 'nav:current', u: tab.url })
          // Push DOM snapshot request
          await pushEvent(tabId, { t: 'dom:document_idle', d: { html: '<!DOCTYPE html>' } })
        }

        // Trigger rules execution
        await setDomDone(tabId)
        await scheduleFinalize(tabId, 100)
      } catch (e) {
        console.error('panel:runNow error:', e)
      }
    })()
    send?.('ok')
    return true
  }
  if (st?.event && tabId) {
    pushEvent(tabId, { t: `dom:${st.event}`, d: st.data })
    if (st.event === 'document_idle') {
      chrome.storage.local.get('ui:autoRun').then((v)=> {
        if (v['ui:autoRun'] !== false) markDomPhase(tabId)
      }).catch(()=> markDomPhase(tabId))
    }
  }
  if (msg === 'tabIdPls' && tabId) send?.({ tabId, url: sender.tab?.url })
  return true
}

export const registerMessageListeners = () => {
  chrome.runtime.onMessage.addListener((msg, sender, send) => handleMessage(msg, sender, send))
}
