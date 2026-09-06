import { parseRobotsDirectives } from './robots'
import { findRobotsTokens, parseDirectiveNumber } from './robots-tokens'
import type { RobotsDirective } from './robots.types'

import type { Page } from '@/core/types'

const restrictiveNumber = (directives: RobotsDirective[], name: string): number | null => {
  const values = findRobotsTokens(directives, name).map(({ value }) => parseDirectiveNumber(value))
    .filter((entry) => entry.valid).map((entry) => entry.value!)
  const limited = values.filter((value) => value >= 0)
  return limited.length ? Math.min(...limited) : values.length ? -1 : null
}

export const resolveEffectiveRobots = (all: RobotsDirective[], userAgent = 'googlebot') => {
  const agent = userAgent.toLowerCase()
  const directives = all.filter(({ ua }) => ua === 'robots' || ua === agent)
  const has = (name: string) => findRobotsTokens(directives, name).length > 0
  const maxSnippet = restrictiveNumber(directives, 'max-snippet')
  const previews = findRobotsTokens(directives, 'max-image-preview').map(({ value }) => value)
  const maxImagePreview = (['none', 'standard', 'large'] as const).find((value) => previews.includes(value)) ?? null
  const noindex = directives.some((directive) => directive.hasNoindex)
  const nofollow = directives.some((directive) => directive.hasNofollow)
  const nosnippet = has('nosnippet') || maxSnippet === 0
  return { userAgent: agent, directives, noindex, nofollow, nosnippet, noimageindex: has('noimageindex'),
    maxSnippet: nosnippet ? 0 : maxSnippet, maxVideoPreview: restrictiveNumber(directives, 'max-video-preview'), maxImagePreview }
}

export const pageEffectiveRobots = (page: Pick<Page, 'doc' | 'headers' | 'responseHeaderFields'>, userAgent = 'googlebot') =>
  resolveEffectiveRobots(parseRobotsDirectives(page.doc, page.headers, page.responseHeaderFields), userAgent)
