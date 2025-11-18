import { createSchemaRule } from './createSchemaRule'

export const schemaVideoRule = createSchemaRule({
  id: 'schema:video',
  name: 'Schema VideoObject',
  types: 'VideoObject',
  searchStrings: ['Video'],
  validator: (n) => !!n['name'] && !!n['description'] && !!n['thumbnailUrl'] && !!n['uploadDate'],
})

