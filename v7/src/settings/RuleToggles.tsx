type Flags = Record<string, boolean>

export const RuleToggles = ({
  flags, updateFlags
}: {
  flags: Flags;
  updateFlags: (newFlags: Flags) => void;
}) => (
  <div className="settings-section">
    <h2>Rule Toggles</h2>
    <p className="text-sm text-gray-500 mb-4">Enable or disable individual test rules</p>
    <div className="grid grid-cols-2 gap-4">
      {Object.entries(flags).map(([key, value]) => (
        <div key={key} className="setting-row">
          <div className="setting-label">
            <h3 className="text-sm">{key.replace(/_/g, ' ')}</h3>
          </div>
          <div className="setting-control">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => {
                  updateFlags({ ...flags, [key]: e.target.checked })
                }}
              />
            </label>
          </div>
        </div>
      ))}
    </div>
  </div>
)