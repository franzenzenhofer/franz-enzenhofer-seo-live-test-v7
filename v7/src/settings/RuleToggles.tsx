import { rulesInventory } from '@/rules/inventory'

type Flags = Record<string, boolean>

type Props = {
  flags: Flags
  updateFlags: (next: Flags) => void
  autoEnabled: (id: string) => boolean
}

export const RuleToggles = ({ flags, updateFlags, autoEnabled }: Props) => (
  <div className="bg-gray-50 rounded-lg p-4">
    <h2 className="text-lg font-semibold mb-2">Rule Toggles</h2>
    <p className="text-xs text-gray-600 mb-4">Override defaults (auto = enabled when creds exist)</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto pr-1">
      {rulesInventory.map((rule) => {
        const override = flags[rule.id]
        const checked = typeof override === 'boolean' ? override : (autoEnabled(rule.id) || rule.enabledByDefault)
        return (
          <label key={rule.id} className="flex items-center justify-between p-2 bg-white rounded">
            <span className="text-xs font-medium text-gray-900">
              {rule.name}
              <span className="block text-[10px] text-gray-500">
                {rule.id}{autoEnabled(rule.id) ? ' · auto' : ''}
              </span>
            </span>
            <input
              type="checkbox"
              className="ml-2 w-4 h-4 text-blue-600 rounded cursor-pointer"
              checked={checked}
              onChange={(e) => updateFlags({ ...flags, [rule.id]: e.target.checked })}
            />
          </label>
        )
      })}
    </div>
  </div>
)
