import { useEffect, useState } from 'react'

import type { RunMeta } from '@/shared/runMeta'
import { readRunMeta, readLastRunMeta, watchRunMeta } from '@/shared/runMeta'

export const useRunMeta = (tabId: number | null) => {
  const [meta, setMeta] = useState<RunMeta | null>(null)

  useEffect(() => {
    let unsub: (() => void) | null = null
    let cancelled = false
    const boot = async () => {
      if (!tabId) {
        const last = await readLastRunMeta().catch(() => null)
        if (!cancelled) setMeta(last ? { url: last.url, ranAt: last.ranAt, runId: last.runId, status: last.status || 'completed' } : null)
        return
      }
      const initial = await readRunMeta(tabId).catch(() => null)
      if (!cancelled) setMeta(initial)
      unsub = watchRunMeta(tabId, (value) => setMeta(value))
    }
    boot().catch(() => {})
    return () => {
      cancelled = true
      unsub?.()
    }
  }, [tabId])

  return meta
}
