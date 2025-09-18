import { describe, it, expect } from 'vitest'
import { enableAndOpenSidePanel } from '@/background/panel'

describe('background panel', () => {
  it('enables and opens side panel for tab', async () => {
    const calls: string[] = []
    // @ts-expect-error test shim
    globalThis.chrome = {
      sidePanel: {
        setOptions: async (_opts: unknown) => { calls.push('set') },
        open: async (_opts: unknown) => { calls.push('open') },
      },
    }
    await enableAndOpenSidePanel(7, 'src/sidepanel.html')
    expect(calls).toEqual(['set', 'open'])
  })
})

