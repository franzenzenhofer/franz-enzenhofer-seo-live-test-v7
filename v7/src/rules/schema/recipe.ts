import type { Rule } from '@/core/types'
import { parseLd, findType, docs } from '@/shared/structured'

export const schemaRecipeRule: Rule = {
  id: 'schema:recipe',
  name: 'Schema Recipe',
  enabled: true,
  async run(page) {
    const n = findType(parseLd(page.doc), 'recipe')[0]
    if (!n) return { label: 'SCHEMA', message: 'No Recipe JSON‑LD', type: 'info' }
    const ok = !!n['name'] && !!n['image'] && (Array.isArray(n['recipeIngredient']) || Array.isArray(n['recipeInstructions']))
    return ok ? { label: 'SCHEMA', message: `Recipe OK · Docs: ${docs('recipe')}`, type: 'ok' } : { label: 'SCHEMA', message: `Recipe missing fields · Docs: ${docs('recipe')}`, type: 'warn' }
  },
}

