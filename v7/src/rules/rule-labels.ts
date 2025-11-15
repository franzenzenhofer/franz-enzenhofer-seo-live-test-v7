/**
 * Centralized rule label constants
 * Used in rule results to categorize output
 * Eliminates 200+ hardcoded label strings across rule files
 */

export const RULE_LABELS = {
  HEAD: 'HEAD',
  HTTP: 'HTTP',
  BODY: 'BODY',
  OG: 'OG',
  SCHEMA: 'SCHEMA',
  GSC: 'GSC',
  DOM: 'DOM',
  ROBOTS: 'ROBOTS',
  URL: 'URL',
  SPEED: 'SPEED',
  A11Y: 'A11Y',
  GOOGLE: 'GOOGLE',
  DEBUG: 'DEBUG',
  DISCOVER: 'DISCOVER',
} as const

export type RuleLabel = typeof RULE_LABELS[keyof typeof RULE_LABELS]
