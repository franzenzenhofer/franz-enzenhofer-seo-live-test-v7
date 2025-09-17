import { useState } from 'react'

import { usePageInfo } from './usePageInfo'
import { InfoRow } from './InfoRow'
import { Results } from './Results'
import { Settings } from './Settings'

export const App = () => {
  const [settings, setSettings] = useState(false)
  const q = usePageInfo()
  if (q.isLoading) return <p className="p-3">Loading…</p>
  if (q.isError) return <p className="p-3">{String(q.error)}</p>
  const d = q.data!
  return (
    <div className="p-3 space-y-3 w-[360px]">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Live Test</h1>
        <button className="text-sm underline" onClick={()=> setSettings(s=>!s)}>{settings? 'Results' : 'Settings'}</button>
      </div>
      {settings ? (
        <Settings />
      ) : (
        <>
          <div className="space-y-2">
            <InfoRow k="URL" v={d.url} />
            <InfoRow k="Title" v={d.title} />
            <InfoRow k="Description" v={d.description || '—'} />
            <InfoRow k="Canonical" v={d.canonical || '—'} />
          </div>
          <Results />
        </>
      )}
    </div>
  )
}
