import { describe, it, expect } from 'vitest'
import { schemaRecipeRule } from '@/rules/schema/recipe'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('schema: recipe', () => {
  it('passes with name, image, and recipeIngredient', async () => {
    const json = '<script type="application/ld+json">{"@type":"Recipe","name":"Chocolate Cake","image":"/cake.jpg","recipeIngredient":["flour","sugar","cocoa"]}</script>'
    const r = await schemaRecipeRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })

  it('passes with name, image, and recipeInstructions', async () => {
    const json = '<script type="application/ld+json">{"@type":"Recipe","name":"Chocolate Cake","image":"/cake.jpg","recipeInstructions":["Mix flour","Bake"]}</script>'
    const r = await schemaRecipeRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })

  it('passes with both ingredients and instructions', async () => {
    const json = '<script type="application/ld+json">{"@type":"Recipe","name":"Chocolate Cake","image":"/cake.jpg","recipeIngredient":["flour"],"recipeInstructions":["Mix"]}</script>'
    const r = await schemaRecipeRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })

  it('fails when name is missing', async () => {
    const json = '<script type="application/ld+json">{"@type":"Recipe","image":"/cake.jpg","recipeIngredient":["flour"]}</script>'
    const r = await schemaRecipeRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })

  it('fails when image is missing', async () => {
    const json = '<script type="application/ld+json">{"@type":"Recipe","name":"Cake","recipeIngredient":["flour"]}</script>'
    const r = await schemaRecipeRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })

  it('fails when both ingredients and instructions are missing', async () => {
    const json = '<script type="application/ld+json">{"@type":"Recipe","name":"Cake","image":"/cake.jpg"}</script>'
    const r = await schemaRecipeRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })

  it('fails when ingredients/instructions are not arrays', async () => {
    const json = '<script type="application/ld+json">{"@type":"Recipe","name":"Cake","image":"/cake.jpg","recipeIngredient":"flour"}</script>'
    const r = await schemaRecipeRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })

  it('handles no schema gracefully', async () => {
    const r = await schemaRecipeRule.run({ html:'', url:'https://ex.com', doc: D('') } as any, { globals: {} })
    expect((r as any).type).toBe('info')
  })
})

