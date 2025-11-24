import { ToggleRow } from './ToggleRow'

import { useStorageSetting } from '@/shared/hooks/useStorageSetting'
import { STORAGE_KEYS } from '@/shared/storage-keys'

export const GeneralSettings = () => {
  // Direct hook usage - NO props needed!
  // Real-time sync across all contexts (settings page, sidepanel, etc.)
  const [autoRun, setAutoRun] = useStorageSetting(STORAGE_KEYS.UI.AUTO_RUN, true)
  const [autoClear, setAutoClear] = useStorageSetting(STORAGE_KEYS.UI.AUTO_CLEAR, true)
  const [debugMode, setDebugMode] = useStorageSetting(STORAGE_KEYS.UI.DEBUG, true)

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">General Settings</h2>
      <p className="text-xs text-gray-600 mb-4">
        Control how the extension behaves when navigating between pages
      </p>
      <div className="space-y-3">
        <ToggleRow
          label="Auto Run"
          description="Automatically execute all enabled rules when page finishes loading (recommended)"
          checked={autoRun}
          onChange={setAutoRun}
        />
        <ToggleRow
          label="Auto Clear"
          description="Clear previous test results when navigating to a new page (prevents clutter)"
          checked={autoClear}
          onChange={setAutoClear}
        />
        <ToggleRow
          label="Debug data"
          description="Show missing rule counts and advanced debugging helpers in the UI"
          checked={debugMode}
          onChange={setDebugMode}
        />
      </div>
      {debugMode && (
        <p className="text-[11px] text-gray-600 mt-3">
          Debug tools (logs, run history, storage inspector) are available below.
        </p>
      )}
    </div>
  )
}
