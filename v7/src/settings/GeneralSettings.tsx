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
  <div className="settings-section">
    <h2>General Settings</h2>
    <ToggleRow
      label="Auto Run"
      description="Automatically run tests when navigating to new pages"
      checked={autoRun}
      onChange={(v) => { setAutoRun(v); toggleSetting('autoRun', v) }}
    />
    <ToggleRow
      label="Auto Clear"
      description="Clear previous results when running new tests"
      checked={autoClear}
      onChange={(v) => { setAutoClear(v); toggleSetting('autoClear', v) }}
    />
    <ToggleRow
      label="Preserve Log"
      description="Keep logs when navigating to new pages"
      checked={preserveLog}
      onChange={(v) => { setPreserveLog(v); toggleSetting('preserveLog', v) }}
    />
  </div>
)