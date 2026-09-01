import { createSchemaRule } from './createSchemaRule'

export const schemaHowToRule = createSchemaRule({
  id: 'schema:howto',
  name: 'Schema HowTo',
  types: 'HowTo',
  validator: (n) => {
    const missing: string[] = []
    if (!n['name']) missing.push('name')
    if (!Array.isArray(n['step'])) missing.push('step')
    return { ok: missing.length === 0, missing }
  },
})

