import { useState } from 'react'

import { RuleCategoryFilter } from './RuleCategoryFilter'
import { RuleGridItem } from './RuleGridItem'

import { rulesInventory } from '@/rules/inventory'

type Flags = Record<string, boolean>

type Props = {
  flags: Flags
  updateFlags: (next: Flags) => void
  autoEnabled: (id: string) => boolean
}

const getCategory = (id: string) => id.split(':')[0] || 'other'

export const RuleToggles = ({ flags, updateFlags, autoEnabled }: Props) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())

  const filteredRules = rulesInventory.filter(rule => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = !q || rule.name.toLowerCase().includes(q) || rule.id.toLowerCase().includes(q)
    const matchesCategory = selectedCategories.size === 0 || selectedCategories.has(getCategory(rule.id))
    return matchesSearch && matchesCategory
  })

  const toggleCategory = (cat: string) => {
    const next = new Set(selectedCategories)
    if (next.has(cat)) next.delete(cat)
    else next.add(cat)
    setSelectedCategories(next)
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">Rule Configuration</h2>

      <input
        type="search"
        placeholder="Search 101 rules by name or ID..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-4 py-2 border rounded-md mb-3 text-sm"
      />

      <RuleCategoryFilter
        selected={selectedCategories}
        onToggle={toggleCategory}
        onClear={() => setSelectedCategories(new Set())}
      />

      <p className="text-xs text-gray-600 mb-3">
        Showing {filteredRules.length} of {rulesInventory.length} rules
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto pr-1">
        {filteredRules.map((rule) => {
          const override = flags[rule.id]
          const checked = typeof override === 'boolean' ? override : (autoEnabled(rule.id) || rule.enabledByDefault)
          return (
            <RuleGridItem
              key={rule.id}
              rule={rule}
              checked={checked}
              autoEnabled={autoEnabled(rule.id)}
              onChange={(checked) => updateFlags({ ...flags, [rule.id]: checked })}
            />
          )
        })}
      </div>
    </div>
  )
}
