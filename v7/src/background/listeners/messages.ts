import { handleProbeChainMessage } from '../probes/handler'
import { abortSession } from '../rules/sessions'
import type { ProbeChainMessage } from '../probes/handler'

import { handleLogsBridgeMessage } from './logsBridge'
import { handleAuditMessage } from './phaseMessages'

import { isValidTabId, log, logSystem } from '@/shared/logs'
import { incr } from '@/shared/telemetry'

type Sender = chrome.runtime.MessageSender
type CrashMsg = { channel?: string; context?: string; kind?: string; message?: string; stack?: string }

const handleCrashReport = (st: CrashMsg): void => {
  const line = `crash:${st.context || '?'}:${st.kind || '?'} ${st.message || ''} ${(st.stack || '').slice(0, 200)}`
  logSystem(line).catch(() => {})
}

const handlePanelClean = (tabId: number | null): void => {
  if (!isValidTabId(tabId)) return
  abortSession(tabId, 'cleaned').catch(() => {})
}

export const handleMessage = (msg: unknown, sender: Sender, send?: (resp?: unknown) => void) => {
  incr('msg.in')
  const st = msg as { event?: string; data?: unknown; type?: string; tabId?: number; channel?: string; message?: string; t?: string; d?: { tabId?: number }; context?: string; kind?: string; stack?: string } | null
  const tabId = st?.tabId || sender.tab?.id || null
  if (st?.channel === 'crash') { incr('crashnet.fired'); handleCrashReport(st); return false }
  if (st?.t === 'panel:clean') { handlePanelClean(st.d?.tabId ?? null); return false }
  if (st && (st.type === 'audit:eligibility' || st.event)) return handleAuditMessage(st, sender, send)
  if (st?.channel === 'log' && st.message) {
    if (!isValidTabId(tabId)) {
      logSystem(`log:drop tabId=${tabId ?? 'null'} message=${st.message.slice(0, 120)}`).catch(() => {})
      return false
    }
    log(tabId, st.message).catch((err) => console.error('[bg][log] failed', err))
    return false
  }
  if (handleLogsBridgeMessage(st?.type, tabId, send)) return true
  if (msg === 'tabIdPls' && tabId) {
    send?.({ tabId, url: sender.tab?.url })
    return false
  }
  if (st?.channel === 'offscreen') {
    const probe = (st as { probe?: ProbeChainMessage }).probe
    if (probe) return handleProbeChainMessage(probe, send)
    return false
  }
  if (st?.channel || st?.type) {
    logSystem(`runtime:unhandled channel=${st?.channel || 'none'} type=${st?.type || 'none'} tabId=${tabId ?? 'null'}`).catch(() => {})
  }
  return false
}

export const registerMessageListeners = () => {
  chrome.runtime.onMessage.addListener((msg, sender, send) => handleMessage(msg, sender, send))
}
