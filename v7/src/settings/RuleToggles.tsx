type Flags = Record<string, boolean>

export const RuleToggles = ({
  flags, updateFlags
}: {
  flags: Flags;
  updateFlags: (newFlags: Flags) => void;
}) => (
  <div className="bg-gray-50 rounded-lg p-4">
    <h2 className="text-lg font-semibold mb-2">Rule Toggles</h2>
    <p className="text-xs text-gray-600 mb-4">Enable or disable individual test rules</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {Object.entries(flags).map(([key, value]) => (
        <div key={key} className="flex items-center justify-between p-2 bg-white rounded">
          <label className="flex items-center cursor-pointer w-full">
            <span className="text-xs font-medium text-gray-900 flex-1">
              {key.replace(/_/g, ' ').replace(/:/g, ' - ')}
            </span>
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => {
                updateFlags({ ...flags, [key]: e.target.checked })
              }}
              className="ml-2 w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
          </label>
        </div>
      ))}
    </div>
  </div>
)