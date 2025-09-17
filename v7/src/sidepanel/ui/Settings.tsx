import React, { useEffect, useState } from 'react'

import { registry } from '@/rules/registry'

type Flags = Record<string, boolean>

export const Settings = () => {
  const [flags, setFlags] = useState<Flags>({})
  const [vars, setVars] = useState<Record<string,string>>({})
  useEffect(() => {
    chrome.storage.local.get(['rule-flags','globalRuleVariables'], ({ ['rule-flags']: f, globalRuleVariables }) => {
      setFlags(f || {}); setVars(globalRuleVariables || {})
    })
  }, [])
  const toggle = (id: string) => {
    const nf = { ...flags, [id]: !(flags[id] ?? true) }
    setFlags(nf); chrome.storage.local.set({ 'rule-flags': nf })
  }
  const setVar = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const nv = { ...vars, [k]: e.target.value }; setVars(nv); chrome.storage.local.set({ globalRuleVariables: nv })
  }
  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-semibold">Rules</h2>
        {registry.map(r => (
          <label key={r.id} className="block text-sm"><input type="checkbox" checked={flags[r.id] ?? r.enabled} onChange={()=> toggle(r.id)} /> {r.name}</label>
        ))}
      </div>
      <div>
        <h2 className="font-semibold">API Keys</h2>
        <label className="block text-sm">PSI Key<input className="border p-1 w-full" value={vars['google_page_speed_insights_key']||''} onChange={setVar('google_page_speed_insights_key')} /></label>
        <label className="block text-sm">MFT Key<input className="border p-1 w-full" value={vars['google_mobile_friendly_test_key']||''} onChange={setVar('google_mobile_friendly_test_key')} /></label>
      </div>
    </div>
  )
}
