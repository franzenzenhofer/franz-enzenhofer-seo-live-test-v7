import type { RegisteredRule, Rule, RuleInput } from '@/core/types'

const COMPARE = new Set([
  'dom:client-side-rendering',
  'dom:parameterized-links-diff',
  'head:meta-keywords',
  'head:meta-viewport',
  'head:rel-alternate-media',
  'head:unavailable-after',
])

const CONTEXT = new Set([
  'body:internal-link-status',
  'debug:page-object',
  'debug:page-summary',
  'discover:indexable',
  'discover:max-image-preview-large',
  'head:canonical-header',
  'head:canonical-nav-consistency',
  'head:canonical-noindex-conflict',
  'head:canonical-signals-conflict',
  'head:hreflang-multipage',
  'head:robots-agent-conflicts',
  'head:robots-max-image-preview',
  'head:robots-max-snippet',
  'head:robots-max-video-preview',
  'head:robots-noimageindex',
  'head:robots-nosnippet',
])

const IDLE_PREFIXES = ['a11y:', 'body:', 'discover:', 'dom:', 'schema:', 'speed:']
const CONTEXT_PREFIXES = ['gsc:', 'http:', 'psi:', 'robots:', 'url:']

export const ruleInputForId = (id: string): RuleInput => {
  if (COMPARE.has(id)) return 'compare'
  if (CONTEXT.has(id) || CONTEXT_PREFIXES.some((prefix) => id.startsWith(prefix))) return 'context'
  if (id === 'google:amp-cache-url' || IDLE_PREFIXES.some((prefix) => id.startsWith(prefix))) return 'idle'
  if (id.startsWith('google:')) return 'context'
  return 'static'
}

export const registerRule = (rule: Rule): RegisteredRule => ({ ...rule, input: ruleInputForId(rule.id) })
