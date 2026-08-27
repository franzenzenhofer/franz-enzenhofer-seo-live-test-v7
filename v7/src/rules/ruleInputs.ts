import type { RegisteredRule, Rule, RuleInput } from '@/core/types'

const COMPARE = new Set([
  'dom:client-side-rendering',
  'dom:parameterized-links-diff',
  'head:unavailable-after',
])

const IDLE = new Set([
  'a11y:linked-images-alt',
  'body:images-layout',
  'body:images-lazy',
  'body:nofollow',
  'body:unsecure-input',
  'dom:data-nosnippet',
  'dom:ldjson',
  'dom:node-count',
  'dom:node-depth',
  'dom:top-words',
  'google:amp-cache-url',
  'head:meta-keywords',
  'head:meta-viewport',
  'head:rel-alternate-media',
  'speed:first-paint',
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

const COMPLETE_DOM_CONTEXT = new Set([
  'body:internal-link-status',
  'debug:page-object',
  'debug:page-summary',
  'discover:indexable',
  'discover:max-image-preview-large',
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
  'http:mixed-content',
])

const IDLE_PREFIXES = ['discover:', 'schema:']
const CONTEXT_PREFIXES = ['gsc:', 'http:', 'psi:', 'robots:', 'url:']

export const ruleInputForId = (id: string): RuleInput => {
  if (COMPARE.has(id)) return 'compare'
  if (CONTEXT.has(id) || CONTEXT_PREFIXES.some((prefix) => id.startsWith(prefix))) return 'context'
  if (IDLE.has(id) || IDLE_PREFIXES.some((prefix) => id.startsWith(prefix))) return 'idle'
  if (id.startsWith('google:')) return 'context'
  return 'static'
}

export const registerRule = (rule: Rule): RegisteredRule => ({ ...rule, input: ruleInputForId(rule.id) })

export const requiresCompleteDomFacts = (id: string): boolean => COMPLETE_DOM_CONTEXT.has(id)
