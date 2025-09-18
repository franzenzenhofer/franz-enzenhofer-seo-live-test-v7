import { useEffect, useState } from 'react'

export const AutoRun = () => {
  const [on, setOn] = useState(true)
  useEffect(()=>{ chrome.storage.local.get('ui:autoRun').then((v)=> setOn(v['ui:autoRun'] !== false)).catch(()=>{}) },[])
  const toggle = async () => { const v = !on; setOn(v); await chrome.storage.local.set({ 'ui:autoRun': v }) }
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={on} onChange={toggle} />
      Auto‑run on navigation
    </label>
  )
}

