type PriorityOperator = '<' | '<=' | '>' | '>=' | '='

export type PriorityConstraint = { op: PriorityOperator; value: number; raw: string }
export type PriorityRange = { min: number; max: number; raw: string }
export type PriorityToken =
  | { kind: 'constraint'; op: PriorityOperator; value: number; raw: string }
  | { kind: 'range'; min: number; max: number; raw: string }

export type PriorityFilter = {
  constraints: PriorityConstraint[]
  range?: PriorityRange
  raw: string[]
}

const toNumber = (value: string) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? null : parsed
}

export const parsePriorityToken = (token: string): PriorityToken | null => {
  const range = token.match(/^(p|priority):(\d+)-(\d+)$/i)
  if (range) {
    const min = toNumber(range[2] ?? '')
    const max = toNumber(range[3] ?? '')
    if (min === null || max === null) return null
    return { kind: 'range', min: Math.min(min, max), max: Math.max(min, max), raw: token }
  }
  const compare = token.match(/^(p|priority)(<=|>=|=|<|>)(\d+)$/i)
  if (compare) {
    const value = toNumber(compare[3] ?? '')
    if (value === null) return null
    return { kind: 'constraint', op: compare[2] as PriorityOperator, value, raw: token }
  }
  const exact = token.match(/^(p|priority):(\d+)$/i)
  if (exact) {
    const value = toNumber(exact[2] ?? '')
    if (value === null) return null
    return { kind: 'constraint', op: '=', value, raw: token }
  }
  return null
}

export const buildPriorityFilter = (tokens: PriorityToken[]): PriorityFilter | null => {
  if (!tokens.length) return null
  const constraints = tokens.filter((t): t is Extract<PriorityToken, { kind: 'constraint' }> => t.kind === 'constraint')
  const ranges = tokens.filter((t): t is Extract<PriorityToken, { kind: 'range' }> => t.kind === 'range')
  return {
    constraints: constraints.map((token) => ({ op: token.op, value: token.value, raw: token.raw })),
    range: ranges[ranges.length - 1],
    raw: tokens.map((token) => token.raw),
  }
}

export const matchesPriorityFilter = (priority: number | null | undefined, filter?: PriorityFilter | null) => {
  if (!filter) return true
  if (typeof priority !== 'number') return false
  if (filter.range && (priority < filter.range.min || priority > filter.range.max)) return false
  for (const constraint of filter.constraints) {
    if (constraint.op === '<' && !(priority < constraint.value)) return false
    if (constraint.op === '<=' && !(priority <= constraint.value)) return false
    if (constraint.op === '>' && !(priority > constraint.value)) return false
    if (constraint.op === '>=' && !(priority >= constraint.value)) return false
    if (constraint.op === '=' && priority !== constraint.value) return false
  }
  return true
}
