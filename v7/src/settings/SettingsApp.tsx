import React from 'react'

import { GeneralSettings } from './GeneralSettings'
import { GoogleAccount } from './GoogleAccount'
import { ApiKeys } from './ApiKeys'
import { RuleToggles } from './RuleToggles'
import { useSettings } from './useSettings'

import { getStoredToken, interactiveLogin, revoke } from '@/shared/auth'

type Flags = Record<string, boolean>

export const SettingsApp = () => {
  const s = useSettings()

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
  const signIn = async () => {
    await interactiveLogin()
    s.setHasToken(!!(await getStoredToken()))
  }
  const signOut = async () => { await revoke(); s.setHasToken(false) }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Live Test Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure extension behavior and API keys</p>
      </div>

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
  )
}