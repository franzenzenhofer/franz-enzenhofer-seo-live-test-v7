import { describe, it, expect } from 'vitest'
import { schemaRecipeRule } from '@/rules/schema/recipe'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('schema: recipe', () => {
  it('needs name image and ingredients/instructions', async () => {
    const json = '<script type="application/ld+json">{"@type":"Recipe","name":"R","image":"/i.jpg","recipeIngredient":["a"],"recipeInstructions":["b"]}</script>'
    const r = await schemaRecipeRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })
})

