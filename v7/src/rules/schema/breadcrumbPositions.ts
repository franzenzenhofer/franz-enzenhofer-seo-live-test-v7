import { createSchemaRule } from './createSchemaRule'

type SchemaNode = Record<string, unknown>

const asList = (value: unknown): SchemaNode[] => (Array.isArray(value) ? value.filter((v): v is SchemaNode => typeof v === 'object' && v !== null) : [])

const hasValidPosition = (value: unknown) => {
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value === 'string') return /^[0-9]+$/.test(value.trim())
  return false
}

const hasValidItem = (value: unknown) => {
  if (typeof value === 'string') return value.trim().length > 0
  if (value && typeof value === 'object') {
    const node = value as SchemaNode
    return Boolean(node['@id'] || node['name'])
  }
  return false
}

export const schemaBreadcrumbPositionsRule = createSchemaRule({
  id: 'schema:breadcrumb:positions',
  name: 'Schema Breadcrumb positions',
  types: 'BreadcrumbList',
  validator: (n) => {
    const items = asList(n['itemListElement'])
    if (!items.length) return { ok: false, missing: ['itemListElement'] }
    const missing: string[] = []
    items.forEach((item, index) => {
      if (!hasValidPosition(item['position'])) missing.push(`itemListElement[${index}].position`)
      if (!hasValidItem(item['item'])) missing.push(`itemListElement[${index}].item`)
    })
    return { ok: missing.length === 0, missing }
  },
})
