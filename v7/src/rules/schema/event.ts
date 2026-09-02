import { createSchemaRule } from './createSchemaRule'

export const schemaEventRule = createSchemaRule({
  id: 'schema:event',
  name: 'Schema Event',
  types: 'Event',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/appearance/structured-data/event'],
    description: 'Warns when an Event node lacks name, startDate, or location.',
  },
  validator: (n) => {
    const missing = ['name', 'startDate', 'location'].filter((key) => !n[key])
    return { ok: missing.length === 0, missing }
  },
})
