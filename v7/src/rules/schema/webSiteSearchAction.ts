import { createSchemaRule } from './createSchemaRule'

type SearchAction = Record<string, unknown>

const toActions = (value: unknown): SearchAction[] => {
  if (!value) return []
  if (Array.isArray(value)) return value.filter((v): v is SearchAction => typeof v === 'object' && v !== null)
  return typeof value === 'object' ? [value as SearchAction] : []
}

const findSearchAction = (value: unknown) =>
  toActions(value).find((action) => String(action['@type'] || '').toLowerCase().includes('searchaction'))

const getTarget = (action: SearchAction) => {
  const target = action['target']
  if (typeof target === 'string') return target
  if (target && typeof target === 'object') {
    const urlTemplate = (target as Record<string, unknown>)['urlTemplate']
    return typeof urlTemplate === 'string' ? urlTemplate : ''
  }
  return ''
}

const getQueryInput = (action: SearchAction) => {
  const value = action['query-input'] || action['queryInput']
  return typeof value === 'string' ? value : ''
}

export const schemaWebSiteSearchActionRule = createSchemaRule({
  id: 'schema:website-searchaction',
  name: 'Schema WebSite SearchAction',
  types: 'WebSite',
  searchStrings: ['WebSite', 'SearchAction'],
  validator: (n) => {
    const missing: string[] = []
    const action = findSearchAction(n['potentialAction'])
    if (!action) return { ok: false, missing: ['potentialAction(SearchAction)'] }

    const target = getTarget(action)
    if (!target) missing.push('potentialAction.target')
    if (target && !target.includes('{search_term_string}')) missing.push('target missing {search_term_string}')

    const queryInput = getQueryInput(action)
    if (!queryInput) missing.push('potentialAction.query-input')

    return { ok: missing.length === 0, missing }
  },
})
