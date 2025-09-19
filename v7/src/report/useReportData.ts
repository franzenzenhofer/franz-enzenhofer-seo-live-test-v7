import { useEffect, useState } from 'react'

import { readResults, type Result } from '@/shared/results'

export const useReportData = () => {
  const [results, setResults] = useState<Result[]>([])
  const [url, setUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tabId = params.get('tabId')
    const resultIndex = params.get('index')
    const pageUrl = params.get('url') || ''

    setUrl(pageUrl)

    if (!tabId) {
      setLoading(false)
      return
    }

    const loadResults = async () => {
      try {
        const tabIdNum = parseInt(tabId, 10)
        const data = await readResults(tabIdNum)
        setResults(data)

        // If specific index, scroll to it
        if (resultIndex) {
          setTimeout(() => {
            const element = document.getElementById(`result-${resultIndex}`)
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 100)
        }
      } catch (error) {
        console.error('Failed to load results:', error)
      } finally {
        setLoading(false)
      }
    }

    loadResults()
  }, [])

  return { results, url, loading }
}