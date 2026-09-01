import { createSchemaRule } from './createSchemaRule'

export const schemaVideoRule = createSchemaRule({
  id: 'schema:video',
  name: 'Schema VideoObject',
  types: 'VideoObject',
  searchStrings: ['Video'],
  validator: (n) => {
    const missing = ['name', 'description', 'thumbnailUrl', 'uploadDate'].filter((key) => !n[key])
    return { ok: missing.length === 0, missing }
  },
})

