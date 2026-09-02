import { createSchemaRule } from './createSchemaRule'

export const schemaVideoRule = createSchemaRule({
  id: 'schema:video',
  name: 'Schema VideoObject',
  types: 'VideoObject',
  searchStrings: ['Video'],
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/appearance/structured-data/video'],
    description: 'Warns when a VideoObject node lacks name, description, thumbnailUrl, or uploadDate.',
  },
  validator: (n) => {
    // Google's VideoObject required-properties table: name, thumbnailUrl, uploadDate
    const missing = ['name', 'thumbnailUrl', 'uploadDate'].filter((key) => !n[key])
    if (missing.length > 0) return { ok: false, missing }

    // description is recommended - report its absence as info
    if (!n['description']) return { ok: false, missing: ['description'], failType: 'info', fieldsLabel: 'recommended' }
    return { ok: true }
  },
})
