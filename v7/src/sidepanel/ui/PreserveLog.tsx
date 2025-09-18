import { useEffect, useState } from 'react'

export const PreserveLog = () => {
  const [keep, setKeep] = useState(true)
  useEffect(()=>{ chrome.storage.local.get('ui:preserveLog').then((v)=> setKeep(v['ui:preserveLog'] !== false)).catch(()=>{}) },[])
  const toggle = async () => { const v = !keep; setKeep(v); await chrome.storage.local.set({ 'ui:preserveLog': v }) }
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={keep} onChange={toggle} />
      Preserve logs
    </label>
  )
}

