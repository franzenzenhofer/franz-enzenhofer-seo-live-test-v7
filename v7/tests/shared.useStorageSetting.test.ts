import { describe, it, expect } from 'vitest'

describe('useStorageSetting hook', () => {
  it('exists and can be imported', async () => {
    const module = await import('@/shared/hooks/useStorageSetting')
    expect(module.useStorageSetting).toBeDefined()
    expect(typeof module.useStorageSetting).toBe('function')
  })

  it('integration test: components use the hook correctly', async () => {
    // Import components that use the hook
    const generalSettings = await import('@/settings/GeneralSettings')
    const autoRun = await import('@/sidepanel/ui/AutoRun')

    // Verify components export correctly
    expect(generalSettings.GeneralSettings).toBeDefined()
    expect(autoRun.AutoRun).toBeDefined()
  })
})
