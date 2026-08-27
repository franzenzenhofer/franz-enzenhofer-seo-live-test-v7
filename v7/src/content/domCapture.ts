import { readPhaseExecution } from './phaseSettings'
import { runPhaseRules } from './phaseRunner'
import { sendPhaseResults } from './phaseMessages'
import { isAuditEligible } from './auditEligibility'

import { collectDomFacts, type DomPhase } from '@/shared/domFacts'
import { Logger } from '@/shared/logger'

const collectNavTiming = () => {
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    if (!nav) return null
    return {
      nextHopProtocol: nav.nextHopProtocol || '',
      transferSize: nav.transferSize,
      encodedBodySize: nav.encodedBodySize,
      decodedBodySize: nav.decodedBodySize,
      type: nav.type,
    }
  } catch {
    return null
  }
}

export const captureDomPhase = async (
  event: 'document_end' | 'document_idle',
  tabIdPromise: Promise<number>,
  getTabId: () => number | null,
) => {
  await tabIdPromise
  if (!await isAuditEligible()) return
  const tabId = getTabId()
  const phase: DomPhase = event === 'document_end' ? 'static' : 'idle'
  const facts = collectDomFacts(document, phase)
  const navTiming = collectNavTiming()
  const { rules, globals } = await readPhaseExecution()
  const results = await runPhaseRules({
    tabId: tabId || 0,
    phase,
    rules,
    page: {
      html: '', url: location.href, doc: document,
      navigationTiming: navTiming || undefined,
      ...(phase === 'static' ? { staticFacts: facts } : { idleFacts: facts }),
    },
    globals,
  })
  Logger.logDirectSend(tabId, 'dom', 'capture done', {
    event, url: location.href, nodes: facts.nodeCount, results: results.length,
  })
  await sendPhaseResults(phase, location.href, results)
  const data = { facts, url: location.href, capturedAt: Date.now(), navTiming }
  await chrome.runtime.sendMessage({ event, data })
  Logger.logDirectSend(tabId, 'dom', 'send', { event, to: 'background', nodes: facts.nodeCount })
}
