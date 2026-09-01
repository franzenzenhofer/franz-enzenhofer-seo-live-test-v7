import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { RunProgress } from '@/sidepanel/ui/RunProgress'
import type { Result } from '@/shared/results'

const mk = (type: string, n: number): Result[] =>
  Array.from({ length: n }, (_, i) => ({ name: `${type}-${i}`, label: 'L', type, message: 'm' }) as Result)

describe('RunProgress', () => {
  it('reports how many rules are done while a run is in flight', () => {
    const html = renderToStaticMarkup(<RunProgress results={[...mk('ok', 44), ...mk('pending', 83)]} />)
    expect(html).toContain('44')
    expect(html).toContain('127')
    expect(html).toContain('35%')
  })

  it('renders nothing once every rule has reported', () => {
    expect(renderToStaticMarkup(<RunProgress results={mk('ok', 10)} />)).toBe('')
  })

  it('renders nothing when there are no results at all', () => {
    expect(renderToStaticMarkup(<RunProgress results={[]} />)).toBe('')
  })
})
