import React from 'react'

import type { Rule } from '@/core/types'

type Flags = Record<string, boolean>

export const GroupToggles = ({ rules, flags, onChange }: { rules: Rule[]; flags: Flags; onChange: (f: Flags) => void }) => {
  const idGroup = (id: string) => (id.split(':')[0]?.split('-')[0] || 'other')
  const groups = Array.from(new Set(rules.map((r) => idGroup(r.id)))).filter(Boolean)
  const toggleGroup = (g: string, on?: boolean) => {
    const nf: Flags = { ...flags }
    for (const r of rules) if (idGroup(r.id) === g) nf[r.id] = on ?? !(flags[r.id] ?? r.enabled)
    onChange(nf); chrome.storage.local.set({ 'rule-flags': nf })
  }
  return (
    <div>
      <h2 className="font-semibold">Rule Groups</h2>
      <div className="flex flex-wrap gap-2 text-sm">
        {groups.map((g) => (
          <div key={g} className="flex items-center gap-1 border rounded px-2 py-1">
            <span>{g}</span>
            <button className="underline" onClick={() => toggleGroup(g, true)}>
              on
            </button>
            <button className="underline" onClick={() => toggleGroup(g, false)}>
              off
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

