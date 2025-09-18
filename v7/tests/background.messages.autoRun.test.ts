import { describe, it, expect, vi } from 'vitest'

// chrome shim and default autoRun=false
// @ts-expect-error test shim
globalThis.chrome = { storage: { local: { get: vi.fn(async ()=> ({ 'ui:autoRun': false })) } } }

vi.mock('@/background/pipeline/collector', () => ({ pushEvent: vi.fn().mockResolvedValue(undefined), markDomPhase: vi.fn() }))

import { handleMessage } from '@/background/listeners/messages'
import * as collector from '@/background/pipeline/collector'

describe('messages: autoRun toggle', () => {
  it('does not markDomPhase when autoRun=false', async () => {
    const md = collector.markDomPhase as unknown as ReturnType<typeof vi.fn>
    await new Promise<void>((res)=>{
      handleMessage({ event: 'document_idle', data: { html: '<html></html>' } }, { tab: { id: 3 } } as any, ()=>{}); setTimeout(res, 0)
    })
    expect(md).not.toHaveBeenCalled()
  })
})

