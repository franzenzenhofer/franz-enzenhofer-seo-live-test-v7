import { useEffect, useState } from 'react'

import { LogsView } from './LogsView'

export const LogsApp = () => {
  const [tabId, setTabId] = useState<number | null>(null)

  useEffect(() => {
    // Get tabId from URL params
    const params = new URLSearchParams(window.location.search)
    const id = params.get('tabId')
    if (id !== null) {
      const parsed = Number(id)
      setTabId(Number.isNaN(parsed) ? null : parsed)
      return
    }

    chrome.storage.session.get('lastActiveTab').then((data) => {
      const stored = data['lastActiveTab']
      if (typeof stored === 'number') setTabId(stored)
    }).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <LogsView tabId={tabId} />
      </div>
    </div>
  )
}
