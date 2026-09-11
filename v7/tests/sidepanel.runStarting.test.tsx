import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { RunNow } from '@/sidepanel/ui/RunNow'
import { RunStarting, isRunStarting } from '@/sidepanel/ui/RunStarting'
import type { RunMeta } from '@/shared/runMeta'

vi.mock('@/sidepanel/utils/runNow', () => ({ executeRunNow: vi.fn() }))

const meta = (status: RunMeta['status']): RunMeta => ({ url: 'https://example.test/', ranAt: '2026-09-11T00:00:00.000Z', status })

describe('isRunStarting', () => {
  it('is true from the click (starting) until the runner seeded rows (running with none)', () => {
    expect(isRunStarting(meta('starting'), 0)).toBe(true)
    expect(isRunStarting(meta('running'), 0)).toBe(true)
  })

  it('is false once rows exist, for terminal states and without any meta', () => {
    expect(isRunStarting(meta('running'), 12)).toBe(false)
    expect(isRunStarting(meta('completed'), 0)).toBe(false)
    expect(isRunStarting(meta('skipped'), 0)).toBe(false)
    expect(isRunStarting(null, 0)).toBe(false)
  })
})

describe('RunStarting', () => {
  it('announces the starting run with the URL as a live status region', () => {
    const html = renderToStaticMarkup(<RunStarting url="https://example.test/page" status="starting" />)
    expect(html).toContain('role="status"')
    expect(html).toContain('aria-live="polite"')
    expect(html).toContain('Starting test run…')
    expect(html).toContain('Reloading https://example.test/page with an empty cache.')
    expect(html).not.toContain('No results yet')
  })

  it('does not claim a cache-bypassing reload for an automatic run that is seeding its rows', () => {
    const html = renderToStaticMarkup(<RunStarting url="https://example.test/page" status="running" />)
    expect(html).toContain('Checking https://example.test/page.')
    expect(html).not.toContain('empty cache')
  })
})

describe('RunNow', () => {
  it('stays busy and disabled while the run is starting, idle otherwise', () => {
    const busy = renderToStaticMarkup(<RunNow url="https://example.test/" starting />)
    expect(busy).toContain('Starting test…')
    expect(busy).toContain('disabled=""')
    expect(busy).toContain('aria-busy="true"')
    const idle = renderToStaticMarkup(<RunNow url="https://example.test/" />)
    expect(idle).toContain('>Run test<')
    expect(idle).not.toContain('disabled=""')
  })
})
