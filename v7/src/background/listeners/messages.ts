import { pushEvent, markDomPhase } from '../pipeline/collector'
import { setDomDone } from '../pipeline/store'
import { scheduleFinalize } from '../pipeline/alarms'

import { handleLogsBridgeMessage } from './logsBridge'

import { isValidTabId, log, logSystem } from '@/shared/logs'

type Sender = chrome.runtime.MessageSender

export const handleMessage = (msg: unknown, sender: Sender, send?: (resp?: unknown) => void) => {
  const st = msg as { event?: string; data?: unknown; type?: string; tabId?: number; channel?: string; message?: string } | null
  const tabId = st?.tabId || sender.tab?.id || null
  if (st?.channel === 'log' && st.message) {
    if (!isValidTabId(tabId)) {
      logSystem(`log:drop tabId=${tabId ?? 'null'} message=${st.message.slice(0, 120)}`).catch(() => {})
      return false
    }
    log(tabId, st.message).catch((err) => console.error('[bg][log] failed', err))
    return false
  }
  if (handleLogsBridgeMessage(st?.type, tabId, send)) return true
  if (st?.type === 'panel:runNow' && tabId) {
    ;(async ()=>{
      try {
        await log(tabId, 'panel:runNow start')
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
        await log(tabId, 'panel:runNow scheduled finalize')
      } catch (e) {
        console.error('panel:runNow error:', e)
        if (tabId) await log(tabId, `panel:runNow error ${(e as Error)?.message || String(e)}`).catch(() => {})
      }
    })()
    send?.('ok')
    return false
  }
  if (st?.event && tabId) {
    pushEvent(tabId, { t: `dom:${st.event}`, d: st.data })
    if (st.event === 'document_idle') {
      chrome.storage.local.get('ui:autoRun').then((v)=> {
        if (v['ui:autoRun'] !== false) markDomPhase(tabId)
      }).catch(()=> markDomPhase(tabId))
    }
    return false
  }
  if (msg === 'tabIdPls' && tabId) {
    send?.({ tabId, url: sender.tab?.url })
    return false
  }
  if (st?.channel === 'offscreen') return false
  if (st?.channel || st?.type) {
    logSystem(`runtime:unhandled channel=${st?.channel || 'none'} type=${st?.type || 'none'} tabId=${tabId ?? 'null'}`).catch(() => {})
  }
  return false
}

export const registerMessageListeners = () => {
  chrome.runtime.onMessage.addListener((msg, sender, send) => handleMessage(msg, sender, send))
}
