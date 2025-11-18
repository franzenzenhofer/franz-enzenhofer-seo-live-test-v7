import { describe, it, expect } from 'vitest'

import { registry } from '@/rules/registry'

const normalize = (value: string) => value.trim().toLowerCase()

describe('Registry rule names', () => {
  it('ensures every Rule.name is unique (case-insensitive)', () => {
    const seen = new Map<string, string[]>()
    for (const rule of registry) {
      const key = normalize(rule.name)
      const ids = seen.get(key) ?? []
      ids.push(rule.id)
      seen.set(key, ids)
    }
    const duplicates = Array.from(seen.entries()).filter(([, ids]) => ids.length > 1)
    if (duplicates.length) {
      const message = duplicates
        .map(([name, ids]) => `${name}: ${ids.join(', ')}`)
        .join('\n')
      expect.fail(`Duplicate rule names detected:\n${message}`)
    }
  })
})
