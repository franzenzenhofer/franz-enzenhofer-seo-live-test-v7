import { ToggleRow } from './ToggleRow'

import { useStorageSetting } from '@/shared/hooks/useStorageSetting'

export const GeneralSettings = () => {
  // Direct hook usage - NO props needed!
  // Real-time sync across all contexts (settings page, sidepanel, etc.)
  const [autoRun, setAutoRun] = useStorageSetting('ui:autoRun', true)
  const [autoClear, setAutoClear] = useStorageSetting('ui:autoClear', true)
  const [preserveLog, setPreserveLog] = useStorageSetting('ui:preserveLog', false)

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">General Settings</h2>
      <div className="space-y-3">
        <ToggleRow
          label="Auto Run"
          description="Automatically run tests when navigating to new pages"
          checked={autoRun}
          onChange={setAutoRun}
        />
        <ToggleRow
          label="Auto Clear"
          description="Clear previous results when running new tests"
          checked={autoClear}
          onChange={setAutoClear}
        />
        <ToggleRow
          label="Preserve Log"
          description="Keep logs when navigating to new pages"
          checked={preserveLog}
          onChange={setPreserveLog}
        />
      </div>
    </div>
  )
}