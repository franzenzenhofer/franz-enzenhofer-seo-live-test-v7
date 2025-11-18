import type { RuleResult } from './types'
import { persistResults } from './util'
import { countResultTypes } from './counts'
import { isSessionActive } from './sessions'

import { log } from '@/shared/logs'

export const createChunkSync = (tabId: number, key: string, runId?: string) => {
  let queue = Promise.resolve()
  const append = (chunk: RuleResult[]) => {
    if (!chunk.length) return queue
    queue = queue.then(async () => {
      if (runId && !await isSessionActive(tabId, runId)) {
        await log(tabId, `runner:drop-stale runId=${runId} tab=${tabId} chunk=${chunk.length}`)
        return
      }
      const got = await chrome.storage.local.get(key)
      const prev = got[key] as RuleResult[] | undefined
      await persistResults(tabId, key, prev, chunk)
      const { [key]: updated } = await chrome.storage.local.get(key)
      const all = (updated as RuleResult[]) || []
      const c = countResultTypes(all)
      const uniqueRules = new Set(all.map(r => r.name)).size
      const runPrefix = runId ? `runId=${runId} ` : ''
      await log(tabId, `runner:counts ${runPrefix}tab=${tabId} total=${all.length} rules=${uniqueRules} ok=${c.ok} warn=${c.warn} error=${c.error} runtime_error=${c.runtime_error} info=${c.info} pending=${c.pending} disabled=${c.disabled}`)
    })
    return queue
  }
  const flush = () => queue
  return { append, flush }
}
