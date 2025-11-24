import { useEffect, useState } from 'react'

import { findResultsByRunId, type Result } from '@/shared/results'
import { readRunMeta, type RunMeta } from '@/shared/runMeta'

export const useReportData = () => {
  const [results, setResults] = useState<Result[]>([])
  const [runMeta, setRunMeta] = useState<RunMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const runId = params.get('runid')
    const resultIndex = params.get('index')
    const hash = window.location.hash || ''

    const scrollToResult = (targetHash: string, queryIndex: string | null) => {
      const candidates: string[] = []
      if (targetHash.startsWith('#rule-index=')) {
        const ix = Number.parseInt(targetHash.replace('#rule-index=', ''), 10)
        if (Number.isFinite(ix)) candidates.push(`result-${ix}`)
      }
      if (queryIndex) {
        const legacy = Number.parseInt(queryIndex, 10)
        if (Number.isFinite(legacy)) {
          candidates.push(`result-${legacy}`)
          candidates.push(`result-${legacy + 1}`)
        }
      }
      if (!candidates.length) return
      setTimeout(() => {
        const target = candidates
          .map((id) => document.getElementById(id))
          .find((el): el is HTMLElement => Boolean(el))
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 120)
    }

    if (!runId) {
      setError('No runid parameter provided')
      setLoading(false)
      return
    }

    const loadData = async () => {
      try {
        const found = await findResultsByRunId(runId)
        if (!found) {
          setError(`No results found for runid: ${runId}`)
          setLoading(false)
          return
        }

        const meta = await readRunMeta(found.tabId).catch(() => null)
        setResults(found.results)
        setRunMeta(meta)

        scrollToResult(hash, resultIndex)
      } catch (err) {
        console.error('Failed to load report data:', err)
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [])

  return { results, runMeta, loading, error }
}
