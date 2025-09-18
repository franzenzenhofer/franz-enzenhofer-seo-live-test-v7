import React, { useEffect, useState } from 'react'

import { RuleFlags } from './RuleFlags'
import { AutoClear } from './AutoClear'
import { AutoRun } from './AutoRun'

import { TOKEN_KEY, getStoredToken, interactiveLogin, revoke } from '@/shared/auth'

type Flags = Record<string, boolean>

export const Settings = () => {
  const [flags, setFlags] = useState<Flags>({})
  const [vars, setVars] = useState<Record<string,string>>({})
  const [hasToken, setHasToken] = useState(false)
  useEffect(() => {
    chrome.storage.local.get(['rule-flags','globalRuleVariables', TOKEN_KEY], ({ ['rule-flags']: f, globalRuleVariables }) => {
      setFlags(f || {}); setVars(globalRuleVariables || {})
    }); getStoredToken().then((t)=> setHasToken(!!t)).catch(() => {})
  }, [])
  const setFlagsAndStore = (nf: Flags) => { setFlags(nf); chrome.storage.local.set({ 'rule-flags': nf }) }
  const setVar = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const nv = { ...vars, [k]: e.target.value }; setVars(nv); chrome.storage.local.set({ globalRuleVariables: nv })
  }
  const signIn = async () => {
    return interactiveLogin().then(() => getStoredToken().then((t)=> setHasToken(!!t)))
  }
  const signOut = async () => { return revoke().then(() => setHasToken(false)) }
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <AutoRun />
        <AutoClear />
      </div>
      <RuleFlags flags={flags} setFlags={setFlagsAndStore} />
      <div>
        <h2 className="font-semibold">Google Login</h2>
        <div className="flex items-center gap-2 text-sm">
          <span>Status: {hasToken ? 'Signed in' : 'Signed out'}</span>
          {!hasToken ? (<button className="border px-2" onClick={signIn}>Sign in</button>) : (<button className="border px-2" onClick={signOut}>Sign out</button>)}
        </div>
      </div>
      <div>
        <h2 className="font-semibold">API Keys & Variables</h2>
        <label className="block text-sm">PSI Key<input className="border p-1 w-full" value={vars['google_page_speed_insights_key']||''} onChange={setVar('google_page_speed_insights_key')} /></label>
        <label className="block text-sm">MFT Key<input className="border p-1 w-full" value={vars['google_mobile_friendly_test_key']||''} onChange={setVar('google_mobile_friendly_test_key')} /></label>
        <label className="block text-sm">GSC Site URL<input className="border p-1 w-full" placeholder="https://example.com/ or sc-domain:example.com" value={vars['gsc_site_url']||''} onChange={setVar('gsc_site_url')} /></label>
      </div>
    </div>
  )
}
