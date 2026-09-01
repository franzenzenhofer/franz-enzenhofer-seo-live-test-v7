import { createSchemaRule } from './createSchemaRule'

export const schemaRecipeRule = createSchemaRule({
  id: 'schema:recipe',
  name: 'Schema Recipe',
  types: 'Recipe',
  validator: (n) => {
    const missing: string[] = []
    if (!n['name']) missing.push('name')
    if (!n['image']) missing.push('image')
    if (!Array.isArray(n['recipeIngredient']) && !Array.isArray(n['recipeInstructions'])) missing.push('recipeIngredient|recipeInstructions')
    return { ok: missing.length === 0, missing }
  },
})

