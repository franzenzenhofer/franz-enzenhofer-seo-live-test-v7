import { readPhaseExecution } from './phaseSettings'
import { runPhaseRules } from './phaseRunner'
import { sendPhaseResults } from './phaseMessages'
import { isAuditEligible } from './auditEligibility'
import { capturePhaseSnapshot } from './phaseSnapshot'

import type { DomPhase } from '@/shared/domFacts'
import { Logger } from '@/shared/logger'

export const captureDomPhase = async (
  event: 'document_end' | 'document_idle',
  tabIdPromise: Promise<number>,
  getTabId: () => number | null,
) => {
  await tabIdPromise
  if (!await isAuditEligible()) return
  const tabId = getTabId()
  const phase: DomPhase = event === 'document_end' ? 'static' : 'idle'
  const { rules, globals } = await readPhaseExecution()
  const snapshot = capturePhaseSnapshot(document, phase, location.href)
  const { facts, url, capturedAt, navigationTiming } = snapshot
  const identity = { version: 1 as const, captureId: crypto.randomUUID(), phase, url, capturedAt }
  const rulesStartedAt = Date.now()
  const results = await runPhaseRules({
    tabId: tabId || 0,
    phase,
    rules,
    page: {
      html: '', url, doc: document,
      navigationTiming,
      ...(phase === 'static' ? { staticFacts: facts } : { idleFacts: facts }),
    },
    globals,
  })
  const rulesCompletedAt = Date.now()
  Logger.logDirectSend(tabId, 'dom', 'capture done', {
    event, url, nodes: facts.nodeCount, results: results.length,
  })
  const chunkCount = await sendPhaseResults(identity, results)
  const data = { ...identity, facts, chunkCount, baseUri: snapshot.baseUri, navTiming: navigationTiming, rulesStartedAt, rulesCompletedAt }
  const response = await chrome.runtime.sendMessage({ event, data }) as { accepted?: boolean } | undefined
  if (!response?.accepted) throw new Error('Phase completion rejected')
  Logger.logDirectSend(tabId, 'dom', 'send', { event, to: 'background', nodes: facts.nodeCount })
}
