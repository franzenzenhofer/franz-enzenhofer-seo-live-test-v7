// MOVED TO TRASH: Legacy side-panel settings UI replaced by dedicated settings.html (2025-11-14).
import React, { useEffect, useState } from 'react'

import { RuleFlags } from './RuleFlags'
import { AutoClear } from './AutoClear'
import { AutoRun } from './AutoRun'
import { PreserveLog } from './PreserveLog'

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
        <PreserveLog />
      </div>
      <RuleFlags flags={flags} setFlags={setFlagsAndStore} />
      <div>
        <h2 className="font-semibold">Google Login</h2>
        <div className="flex items-center gap-2 text-sm">
          <span>Status: {hasToken ? 'Signed in' : 'Signed out'}</span>
          {!hasToken ? (<button className="border px-2" onClick={signIn}>Sign in</button>) : (<button className="border px-2" onClick={signOut}>Sign out</button>)}
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="font-semibold">API Keys & Variables</h2>
        <label className="block text-sm space-y-1">
          <span className="font-medium flex items-center gap-2">
            PageSpeed Insights Key
            <a href="https://developers.google.com/speed/docs/insights/v5/get-started" target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs">
              Docs
            </a>
          </span>
          <input className="border p-1 w-full" value={vars['google_page_speed_insights_key']||''} onChange={setVar('google_page_speed_insights_key')} placeholder="Google Cloud API key" />
          <span className="text-[11px] text-gray-600">Used by PSI rules (mobile/desktop/FCP).</span>
        </label>
        <label className="block text-sm space-y-1">
          <span className="font-medium">GSC Site URL</span>
          <input className="border p-1 w-full" placeholder="https://example.com/ or sc-domain:example.com" value={vars['gsc_site_url']||''} onChange={setVar('gsc_site_url')} />
          <span className="text-[11px] text-gray-600">Required for Search Console rules (top queries, indexing).</span>
        </label>
      </div>
    </div>
  )
}
