import { ToggleRow } from './ToggleRow'

export const GeneralSettings = ({
  autoRun, setAutoRun,
  autoClear, setAutoClear,
  preserveLog, setPreserveLog,
  toggleSetting
}: {
  autoRun: boolean; setAutoRun: (v: boolean) => void;
  autoClear: boolean; setAutoClear: (v: boolean) => void;
  preserveLog: boolean; setPreserveLog: (v: boolean) => void;
  toggleSetting: (key: string, value: boolean) => void;
}) => (
  <div className="bg-gray-50 rounded-lg p-4">
    <h2 className="text-lg font-semibold mb-4">General Settings</h2>
    <div className="space-y-3">
        <ToggleRow
        label="Auto Run"
        description="Automatically run tests when navigating to new pages"
        checked={autoRun}
        onChange={(v) => { setAutoRun(v); toggleSetting('ui:autoRun', v) }}
      />
      <ToggleRow
        label="Auto Clear"
        description="Clear previous results when running new tests"
        checked={autoClear}
        onChange={(v) => { setAutoClear(v); toggleSetting('ui:autoClear', v) }}
      />
      <ToggleRow
        label="Preserve Log"
        description="Keep logs when navigating to new pages"
        checked={preserveLog}
        onChange={(v) => { setPreserveLog(v); toggleSetting('ui:preserveLog', v) }}
      />
    </div>
  </div>
)