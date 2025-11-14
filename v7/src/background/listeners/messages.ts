import { pushEvent, markDomPhase } from '../pipeline/collector'

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
