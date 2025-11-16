import React from 'react'
import { useEffect, useState } from 'react'

import { GeneralSettings } from './GeneralSettings'
import { GoogleAccount } from './GoogleAccount'
import { ApiKeys } from './ApiKeys'
import { RuleToggles } from './RuleToggles'
import { FavoritesManagement } from './FavoritesManagement'
import { useAuthHandlers } from './useAuthHandlers'
import { ImportExport } from './ImportExport'
import { StorageDebug } from './StorageDebug'

import { TOKEN_KEY, getStoredToken } from '@/shared/auth'
import { isAutoEnabled } from '@/rules/autoEnable'
import { Toast } from '@/shared/components/Toast'

type Flags = Record<string, boolean>

export const SettingsApp = () => {
  // Minimal state for components that haven't been refactored yet
  const [flags, setFlags] = useState<Flags>({})
  const [vars, setVars] = useState<Record<string, string>>({})
  const [hasToken, setHasToken] = useState(false)

  const { signIn, signOut } = useAuthHandlers(setHasToken)
  const version = chrome.runtime.getManifest().version

  // Load state for components not yet refactored
  useEffect(() => {
    chrome.storage.local.get(['rule-flags', 'globalRuleVariables', TOKEN_KEY], (items) => {
      setFlags(items['rule-flags'] || {})
      setVars(items['globalRuleVariables'] || {})
    })
    getStoredToken().then((t) => setHasToken(!!t)).catch(() => {})
  }, [])

  const updateFlags = (next: Flags) => {
    setFlags(next)
    chrome.storage.local.set({ 'rule-flags': next })
  }

  const updateVar = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const vars2 = { ...vars, [k]: e.target.value }
    setVars(vars2)
    chrome.storage.local.set({ globalRuleVariables: vars2 })
  }

  const autoEnabled = (id: string) => isAutoEnabled(id, vars, hasToken)

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
          <GeneralSettings />
          <FavoritesManagement />
          <GoogleAccount hasToken={hasToken} signIn={signIn} signOut={signOut} />
          <ApiKeys vars={vars} updateVar={updateVar} />
          <RuleToggles flags={flags} updateFlags={updateFlags} autoEnabled={autoEnabled} />
          <ImportExport />
          <StorageDebug />
        </div>
      </div>

      {/* Toast notifications */}
      <Toast />
    </div>
  )
}
