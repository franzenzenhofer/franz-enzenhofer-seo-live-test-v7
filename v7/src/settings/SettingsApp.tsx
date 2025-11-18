import React, { useMemo } from 'react'

import { GeneralSettings } from './GeneralSettings'
import { GoogleAccount } from './GoogleAccount'
import { ApiKeys } from './ApiKeys'
import { RuleToggles } from './RuleToggles'
import { FavoritesManagement } from './FavoritesManagement'
import { useAuthHandlers } from './useAuthHandlers'
import { ImportExport } from './ImportExport'
import { StorageDebug } from './StorageDebug'

import { TOKEN_KEY } from '@/shared/auth'
import { Toast } from '@/shared/components/Toast'
import { useStorageSetting } from '@/shared/hooks/useStorageSetting'

type Flags = Record<string, boolean>

export const SettingsApp = () => {
  const [storedFlags, setStoredFlags] = useStorageSetting<Flags | null>('rule-flags', null)
  const [storedVars, setStoredVars] = useStorageSetting<Record<string, string> | null>('globalRuleVariables', null)
  const [token] = useStorageSetting<string | null>(TOKEN_KEY, null)
  const flags = storedFlags || {}
  const vars = storedVars || {}
  const hasToken = useMemo(() => Boolean(token), [token])

  const { signIn, signOut } = useAuthHandlers()
  const version = chrome.runtime.getManifest().version

  const updateFlags = (next: Flags) => {
    setStoredFlags(next).catch(() => {})
  }

  const updateVar = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const vars2 = { ...vars, [k]: e.target.value }
    setStoredVars(vars2).catch(() => {})
  }

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
          <RuleToggles flags={flags} updateFlags={updateFlags} />
          <ImportExport />
          <StorageDebug />
        </div>
      </div>

      {/* Toast notifications */}
      <Toast />
    </div>
  )
}
