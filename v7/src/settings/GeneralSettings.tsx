import { ToggleRow } from './ToggleRow'

import { useStorageSetting } from '@/shared/hooks/useStorageSetting'

export const GeneralSettings = () => {
  // Direct hook usage - NO props needed!
  // Real-time sync across all contexts (settings page, sidepanel, etc.)
  const [autoRun, setAutoRun] = useStorageSetting('ui:autoRun', true)
  const [autoClear, setAutoClear] = useStorageSetting('ui:autoClear', true)

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
      </div>
    </div>
  )
}