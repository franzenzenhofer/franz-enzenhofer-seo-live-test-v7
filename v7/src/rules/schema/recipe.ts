import type { Rule } from '@/core/types'
import { parseLd, findType, docs } from '@/shared/structured'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

export const schemaRecipeRule: Rule = {
  id: 'schema:recipe',
  name: 'Schema Recipe',
  enabled: true,
  async run(page) {
    const scripts = page.doc.querySelectorAll('script[type="application/ld+json"]')
    const n = findType(parseLd(page.doc), 'recipe')[0]
    if (!n) return { label: 'SCHEMA', message: 'No Recipe JSON‑LD', type: 'info', name: 'schemaRecipe' }
    const ok = !!n['name'] && !!n['image'] && (Array.isArray(n['recipeIngredient']) || Array.isArray(n['recipeInstructions']))
    const script = Array.from(scripts).find((s) => s.textContent?.includes('Recipe')) || null
    const sourceHtml = extractHtml(script)
    return {
      label: 'SCHEMA',
      message: ok ? `Recipe OK · Docs: ${docs('recipe')}` : `Recipe missing fields · Docs: ${docs('recipe')}`,
      type: ok ? 'ok' : 'warn',
      name: 'schemaRecipe',
      details: script
        ? {
            sourceHtml,
            snippet: extractSnippet(sourceHtml),
            domPath: getDomPath(script),
          }
        : undefined,
    }
  },
}

