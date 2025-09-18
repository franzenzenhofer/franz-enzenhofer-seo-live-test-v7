import { describe, it, expect } from 'vitest'
import { linkedImagesAltRule } from '@/rules/a11y/linkedImagesAlt'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: linked images alt', () => {
  it('warns when missing alt', async () => {
    const r = await linkedImagesAltRule.run({ html:'', url:'', doc: doc('<a href="#"><img/></a>') }, { globals: {} })
    expect((r as any).type).toBe('warn')
  })
})

