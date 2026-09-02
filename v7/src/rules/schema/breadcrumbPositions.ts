import { createSchemaRule } from './createSchemaRule'

type SchemaNode = Record<string, unknown>
const EVIDENCE_LIMIT = 10

// Google types position as Integer with 'Position 1 signifies the beginning of the trail'
const hasValidPosition = (value: unknown) => {
  if (typeof value === 'number') return Number.isInteger(value) && value >= 1
  if (typeof value === 'string') return /^[1-9][0-9]*$/.test(value.trim())
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

// Google requires name on each ListItem, either top-level or carried by the item Thing
const hasValidName = (entry: SchemaNode) => {
  const own = entry['name']
  if (typeof own === 'string' && own.trim().length > 0) return true
  const item = entry['item']
  if (item && typeof item === 'object') {
    const name = (item as SchemaNode)['name']
    return typeof name === 'string' && name.trim().length > 0
  }
  return false
}

export const schemaBreadcrumbPositionsRule = createSchemaRule({
  id: 'schema:breadcrumb:positions',
  name: 'Schema Breadcrumb positions',
  types: 'BreadcrumbList',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/appearance/structured-data/breadcrumb'],
    description: 'Validates every BreadcrumbList itemListElement entry has a numeric position and an item (string URL or object with @id/name).',
  },
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
      const entry = value as SchemaNode
      if (!hasValidPosition(entry['position'])) addMissing(`itemListElement[${index}].position`)
      if (!hasValidName(entry)) addMissing(`itemListElement[${index}].name`)
      // Google: 'If the breadcrumb is the last item in the breadcrumb trail, item is not required'
      const isLast = index === items.length - 1
      if (!isLast && !hasValidItem(entry['item'])) addMissing(`itemListElement[${index}].item`)
    })
    if (missingCount > missing.length) missing.push(`…${missingCount - missing.length} more`)
    return { ok: missingCount === 0, missing }
  },
})
