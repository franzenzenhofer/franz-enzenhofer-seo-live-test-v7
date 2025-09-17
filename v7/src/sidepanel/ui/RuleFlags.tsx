import React from 'react'

import { GroupToggles } from './GroupToggles'

import { registry } from '@/rules/registry'

type Flags = Record<string, boolean>

export const RuleFlags = ({ flags, setFlags }: { flags: Flags; setFlags: (f: Flags) => void }) => (
  <div>
    <h2 className="font-semibold">Rules</h2>
    {registry.map((r) => (
      <label key={r.id} className="block text-sm">
        <input type="checkbox" checked={flags[r.id] ?? r.enabled} onChange={() => setFlags({ ...flags, [r.id]: !(flags[r.id] ?? true) })} /> {r.name}
      </label>
    ))}
    <GroupToggles rules={registry} flags={flags} onChange={setFlags} />
  </div>
)
