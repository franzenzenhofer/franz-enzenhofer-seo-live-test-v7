import { describe, expect, it } from 'vitest'

import { UnsafeProbeError } from '@/shared/probeSafety'
import { withSiteProbe } from '@/shared/siteProbeQueue'

describe('per-origin probe queue safety', () => {
  it('refuses a CMS action URL before taking a slot or running the probe', async () => {
    let ran = false
    const probe = withSiteProbe('https://site.test/wp-admin/post.php?post=1&action=trash&_wpnonce=a', undefined, async () => { ran = true })
    await expect(probe).rejects.toThrow(UnsafeProbeError)
    expect(ran).toBe(false)
  })

  it('still runs an ordinary probe', async () => {
    await expect(withSiteProbe('https://site.test/about', undefined, async () => 'ran')).resolves.toBe('ran')
  })
})
