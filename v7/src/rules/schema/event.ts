import { createSchemaRule } from './createSchemaRule'

export const schemaEventRule = createSchemaRule({
  id: 'schema:event',
  name: 'Schema Event',
  types: 'Event',
  validator: (n) => {
    const missing = ['name', 'startDate', 'location'].filter((key) => !n[key])
    return { ok: missing.length === 0, missing }
  },
})

