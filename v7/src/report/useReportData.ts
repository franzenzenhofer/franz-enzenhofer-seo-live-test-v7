import { useEffect, useState } from 'react'

import { readResults, type Result } from '@/shared/results'
import { readRunMeta, type RunMeta } from '@/shared/runMeta'

export const useReportData = () => {
  const [results, setResults] = useState<Result[]>([])
  const [runMeta, setRunMeta] = useState<RunMeta | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tabId = params.get('tabId')
    const resultIndex = params.get('index')

    if (!tabId) {
      setLoading(false)
      return
    }

    const loadData = async () => {
      try {
        const tabIdNum = parseInt(tabId, 10)
        const [data, meta] = await Promise.all([
          readResults(tabIdNum),
          readRunMeta(tabIdNum).catch(() => null),
        ])
        setResults(data)
        setRunMeta(meta)

        // If specific index, scroll to it
        if (resultIndex) {
          setTimeout(() => {
            const element = document.getElementById(`result-${resultIndex}`)
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 100)
        }
      } catch (error) {
        console.error('Failed to load report data:', error)
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [])

  return { results, runMeta, loading }
}