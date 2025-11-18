import { createSchemaRule } from './createSchemaRule'

export const schemaHowToRule = createSchemaRule({
  id: 'schema:howto',
  name: 'Schema HowTo',
  types: 'HowTo',
  validator: (n) => !!n['name'] && Array.isArray(n['step']),
})

