import { rulesInventory } from '@/rules/inventory'

const getCategory = (id: string) => id.split(':')[0] || 'other'

export const RuleCategoryFilter = ({
  selected,
  onToggle,
  onClear
}: {
  selected: Set<string>
  onToggle: (cat: string) => void
  onClear: () => void
}) => {
  const categories = [...new Set(rulesInventory.map(r => getCategory(r.id)))].sort()

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {categories.map(cat => {
        const count = rulesInventory.filter(r => getCategory(r.id) === cat).length
        const isSelected = selected.has(cat)

        return (
          <button
            key={cat}
            onClick={() => onToggle(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              isSelected
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat} ({count})
          </button>
        )
      })}
      {selected.size > 0 && (
        <button
          onClick={onClear}
          className="px-3 py-1 text-xs text-gray-600 underline"
        >
          Clear
        </button>
      )}
    </div>
  )
}
