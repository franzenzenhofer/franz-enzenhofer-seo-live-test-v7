import { createSchemaRule } from './createSchemaRule'

export const schemaEventRule = createSchemaRule({
  id: 'schema:event',
  name: 'Schema Event',
  types: 'Event',
  validator: (n) => !!n['name'] && !!n['startDate'] && !!n['location'],
})

