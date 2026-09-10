import type { NavigationHop } from '@/background/history/types'
import type { Page } from '@/core/types'
import type { NavigationStep } from '@/shared/navigationSteps'
import { headerChainToRedirectChain } from '@/shared/redirectChainFromEvents'

export const navigationPathSteps = (page: Page, trace: NavigationHop[]): NavigationStep[] => {
  const headers = headerChainToRedirectChain(page.headerChain)?.hops ?? []
  const steps: NavigationStep[] = []
  let cursor = 0
  const headerStep = (index: number): NavigationStep => {
    const hop = headers[index]!
    return { url: hop.url, statusCode: hop.status || undefined, type: hop.location || [301, 302, 303, 307, 308].includes(hop.status) ? 'http_redirect' : 'load', ...(hop.location ? { target: hop.location } : {}) }
  }
  trace.forEach((hop, index) => {
    if (hop.type === 'history_api') { steps.push({ url: hop.url, type: hop.type }); return }
    const match = headers.findIndex((header, i) => i >= cursor && header.url === hop.url)
    if (match >= 0) {
      while (cursor < match) steps.push(headerStep(cursor++))
      steps.push({ ...headerStep(cursor++), ...(hop.type === 'client_redirect' ? { type: hop.type } : {}) })
      return
    }
    const target = hop.type === 'http_redirect' ? trace[index + 1]?.url : undefined
    steps.push({ url: hop.url, type: hop.type, statusCode: hop.statusCode, ...(target ? { target } : {}) })
  })
  while (cursor < headers.length) steps.push(headerStep(cursor++))
  return steps
}
