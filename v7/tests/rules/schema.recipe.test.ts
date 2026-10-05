import { describe, it, expect } from 'vitest'
import { schemaRecipeRule } from '@/rules/schema/recipe'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')
// The field-check row of an entity inside its <script> record, e.g. `Article fields: Missing: headline, image`.
const missingFieldsOf = (r: any) => r.presentation?.evidence.flatMap((record: any) => record.fields)
  .find((field: any) => / fields$/.test(field.key) && String(field.value).startsWith('Missing: '))?.value as string | undefined

const run = async (json: string) =>
  schemaRecipeRule.run({ html:'', url:'https://ex.com', doc: D(`<script type="application/ld+json">${json}</script>`) } as any, { globals: {} })

describe('schema: recipe', () => {
  it('passes with name, image, and recipeIngredient', async () => {
    const r = await run('{"@type":"Recipe","name":"Chocolate Cake","image":"/cake.jpg","recipeIngredient":["flour","sugar","cocoa"]}')
    expect((r as any).type).toBe('ok')
    expect(r.details).toBeUndefined()
  })

  it('passes with name, image, and recipeInstructions', async () => {
    const r = await run('{"@type":"Recipe","name":"Chocolate Cake","image":"/cake.jpg","recipeInstructions":["Mix flour","Bake"]}')
    expect((r as any).type).toBe('ok')
  })

  it('passes with plain-text recipeInstructions (valid per Google)', async () => {
    const r = await run('{"@type":"Recipe","name":"Chocolate Cake","image":"/cake.jpg","recipeInstructions":"Mix everything, then bake."}')
    expect((r as any).type).toBe('ok')
  })

  it('passes with a single HowToStep object as recipeInstructions', async () => {
    const r = await run('{"@type":"Recipe","name":"Cake","image":"/cake.jpg","recipeInstructions":{"@type":"HowToStep","text":"Bake"}}')
    expect((r as any).type).toBe('ok')
  })

  it('passes with both ingredients and instructions', async () => {
    const r = await run('{"@type":"Recipe","name":"Chocolate Cake","image":"/cake.jpg","recipeIngredient":["flour"],"recipeInstructions":["Mix"]}')
    expect((r as any).type).toBe('ok')
  })

  it('fails when name is missing (required per Google)', async () => {
    const r = await run('{"@type":"Recipe","image":"/cake.jpg","recipeIngredient":["flour"]}')
    expect((r as any).type).toBe('warn')
    expect(missingFieldsOf(r)).toContain('name')
  })

  it('fails when image is missing (required per Google)', async () => {
    const r = await run('{"@type":"Recipe","name":"Cake","recipeIngredient":["flour"]}')
    expect((r as any).type).toBe('warn')
    expect(missingFieldsOf(r)).toContain('image')
  })

  it('reports absent ingredients/instructions as recommended (info), not required (warn)', async () => {
    const r = await run('{"@type":"Recipe","name":"Cake","image":"/cake.jpg"}')
    expect((r as any).type).toBe('info')
    expect(missingFieldsOf(r)).toContain('recipeIngredient|recipeInstructions')
  })

  it('handles no schema gracefully', async () => {
    const r = await schemaRecipeRule.run({ html:'', url:'https://ex.com', doc: D('') } as any, { globals: {} })
    expect((r as any).type).toBe('info')
    expect(r.details).toBeUndefined()
  })
})
