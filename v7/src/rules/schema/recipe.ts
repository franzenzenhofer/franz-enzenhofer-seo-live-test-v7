import { createSchemaRule } from './createSchemaRule'

// Google permits recipeInstructions as plain text, a single object, or an array
const hasInstructionData = (n: Record<string, unknown>) => {
  const ingredients = n['recipeIngredient']
  const instructions = n['recipeInstructions']
  const hasIngredients = Array.isArray(ingredients)
  const hasInstructions = Array.isArray(instructions)
    || (typeof instructions === 'string' && instructions.trim().length > 0)
    || (!!instructions && typeof instructions === 'object')
  return hasIngredients || hasInstructions
}

export const schemaRecipeRule = createSchemaRule({
  id: 'schema:recipe',
  name: 'Schema Recipe',
  types: 'Recipe',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/appearance/structured-data/recipe'],
    description: 'Warns when a Recipe node lacks name, image, or an array-valued recipeIngredient/recipeInstructions.',
  },
  validator: (n) => {
    // Google's Recipe required-properties table contains only image and name
    const missing: string[] = []
    if (!n['name']) missing.push('name')
    if (!n['image']) missing.push('image')
    if (missing.length > 0) return { ok: false, missing }

    // recipeIngredient/recipeInstructions are recommended - report their absence as info
    if (!hasInstructionData(n)) {
      return { ok: false, missing: ['recipeIngredient|recipeInstructions'], failType: 'info', fieldsLabel: 'recommended' }
    }
    return { ok: true }
  },
})
