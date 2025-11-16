import type { RuleSummary } from '@/rules/inventory'

export const RuleGridItem = ({
  rule,
  checked,
  autoEnabled,
  onChange
}: {
  rule: RuleSummary
  checked: boolean
  autoEnabled: boolean
  onChange: (checked: boolean) => void
}) => {
  return (
    <label className="flex items-center justify-between p-2 bg-white rounded">
      <span className="text-xs font-medium text-gray-900 flex-1">
        <span className="flex items-center gap-1.5">
          {rule.name}
          {rule.what && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase bg-blue-100 text-blue-800">
              {rule.what}
            </span>
          )}
        </span>
        <span className="block text-[10px] text-gray-500 mt-0.5">
          {rule.id}{autoEnabled ? ' · auto' : ''}
        </span>
      </span>
      <input
        type="checkbox"
        className="ml-2 w-4 h-4 text-blue-600 rounded cursor-pointer flex-shrink-0"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  )
}
