import { describe, expect, it, vi } from 'vitest'

import { isAuditEligible } from '@/content/auditEligibility'

describe('content audit eligibility', () => {
  it('fails closed unless the background confirms an active tab', async () => {
    // @ts-expect-error minimal test shim
    globalThis.chrome = { runtime: { sendMessage: vi.fn()
      .mockResolvedValueOnce({ allowed: true })
      .mockResolvedValueOnce({ allowed: false })
      .mockRejectedValueOnce(new Error('context closed')) } }

    await expect(isAuditEligible()).resolves.toBe(true)
    await expect(isAuditEligible()).resolves.toBe(false)
    await expect(isAuditEligible()).resolves.toBe(false)
  })
})
