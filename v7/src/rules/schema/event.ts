import { createSchemaRule } from './createSchemaRule'

export const schemaEventRule = createSchemaRule(
  'event',
  'Event',
  (n) => !!n['name'] && !!n['startDate'] && !!n['location']
)

