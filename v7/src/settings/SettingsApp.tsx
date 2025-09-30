import React from 'react'

import { GeneralSettings } from './GeneralSettings'
import { GoogleAccount } from './GoogleAccount'
import { ApiKeys } from './ApiKeys'
import { RuleToggles } from './RuleToggles'
import { useSettings } from './useSettings'
import { useAuthHandlers } from './useAuthHandlers'

type Flags = Record<string, boolean>

export const SettingsApp = () => {
  const s = useSettings()
  const { signIn, signOut } = useAuthHandlers(s.setHasToken)
  const version = chrome.runtime.getManifest().version

  const updateFlags = (f: Flags) => {
    s.setFlags(f)
    chrome.storage.local.set({ 'rule-flags': f })
  }
  const updateVar = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const nv = { ...s.vars, [k]: e.target.value }
    s.setVars(nv)
    chrome.storage.local.set({ globalRuleVariables: nv })
  }
  const toggleSetting = (k: string, v: boolean) => chrome.storage.local.set({ [k]: v })

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="border-b pb-4 mb-6">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            Live Test Settings
            <span className="text-sm text-gray-500">v{version}</span>
          </h1>
          <p className="text-sm text-gray-600 mt-1">Configure extension behavior and API keys</p>
        </div>

        <div className="space-y-6">
          <GeneralSettings
            autoRun={s.autoRun} setAutoRun={s.setAutoRun}
            autoClear={s.autoClear} setAutoClear={s.setAutoClear}
            preserveLog={s.preserveLog} setPreserveLog={s.setPreserveLog}
            toggleSetting={toggleSetting}
          />
          <GoogleAccount hasToken={s.hasToken} signIn={signIn} signOut={signOut} />
          <ApiKeys vars={s.vars} updateVar={updateVar} />
          <RuleToggles flags={s.flags} updateFlags={updateFlags} />
        </div>
      </div>
    </div>
  )
}