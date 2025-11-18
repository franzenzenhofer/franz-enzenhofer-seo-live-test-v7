import { createSchemaRule } from './createSchemaRule'

export const schemaRecipeRule = createSchemaRule({
  id: 'schema:recipe',
  name: 'Schema Recipe',
  types: 'Recipe',
  validator: (n) => !!n['name'] && !!n['image'] && (Array.isArray(n['recipeIngredient']) || Array.isArray(n['recipeInstructions'])),
})

