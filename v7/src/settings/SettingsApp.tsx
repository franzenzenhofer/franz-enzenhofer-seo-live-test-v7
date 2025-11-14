import React from 'react'

import { GeneralSettings } from './GeneralSettings'
import { GoogleAccount } from './GoogleAccount'
import { ApiKeys } from './ApiKeys'
import { RuleToggles } from './RuleToggles'
import { useSettings } from './useSettings'
import { useAuthHandlers } from './useAuthHandlers'

import { isAutoEnabled } from '@/rules/autoEnable'

type Flags = Record<string, boolean>

export const SettingsApp = () => {
  const state = useSettings()
  const { signIn, signOut } = useAuthHandlers(state.setHasToken)
  const version = chrome.runtime.getManifest().version
  const updateFlags = (next: Flags) => { state.setFlags(next); chrome.storage.local.set({ 'rule-flags': next }) }
  const updateVar = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const vars = { ...state.vars, [k]: e.target.value }
    state.setVars(vars); chrome.storage.local.set({ globalRuleVariables: vars })
  }
  const toggleSetting = (k: string, v: boolean) => chrome.storage.local.set({ [k]: v })
  const autoEnabled = (id: string) => isAutoEnabled(id, state.vars, state.hasToken)

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="border-b pb-4 mb-6">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            Live Test Settings <span className="text-sm text-gray-500">v{version}</span>
          </h1>
          <p className="text-sm text-gray-600 mt-1">Configure extension behavior and API keys</p>
        </div>
        <div className="space-y-6">
          <GeneralSettings
            autoRun={state.autoRun} setAutoRun={state.setAutoRun}
            autoClear={state.autoClear} setAutoClear={state.setAutoClear}
            preserveLog={state.preserveLog} setPreserveLog={state.setPreserveLog}
            toggleSetting={toggleSetting}
          />
          <GoogleAccount hasToken={state.hasToken} signIn={signIn} signOut={signOut} />
          <ApiKeys vars={state.vars} updateVar={updateVar} />
          <RuleToggles flags={state.flags} updateFlags={updateFlags} autoEnabled={autoEnabled} />
        </div>
      </div>
    </div>
  )
}
