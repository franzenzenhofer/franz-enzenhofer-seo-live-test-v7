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

        // If specific index, scroll to it
        if (resultIndex) {
          setTimeout(() => {
            const element = document.getElementById(`result-${resultIndex}`)
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 100)
        }
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