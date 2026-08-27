import { createSchemaRule } from './createSchemaRule'

type SchemaNode = Record<string, unknown>
const EVIDENCE_LIMIT = 10

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
    const items = n['itemListElement']
    if (!Array.isArray(items) || !items.length) return { ok: false, missing: ['itemListElement'] }
    const missing: string[] = []
    let missingCount = 0
    const addMissing = (value: string) => {
      missingCount++
      if (missing.length < EVIDENCE_LIMIT) missing.push(value)
    }
    items.forEach((value, index) => {
      if (!value || typeof value !== 'object') { addMissing(`itemListElement[${index}]`); return }
      const item = value as SchemaNode
      if (!hasValidPosition(item['position'])) addMissing(`itemListElement[${index}].position`)
      if (!hasValidItem(item['item'])) addMissing(`itemListElement[${index}].item`)
    })
    if (missingCount > missing.length) missing.push(`…${missingCount - missing.length} more`)
    return { ok: missingCount === 0, missing }
  },
})
