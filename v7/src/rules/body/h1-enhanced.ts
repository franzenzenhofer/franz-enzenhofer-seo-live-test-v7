import type { Rule } from '@/core/types'

export const h1EnhancedRule: Rule = {
  id: 'body-h1-enhanced',
  name: 'H1 Analysis (Enhanced)',
  enabled: true,
  run: async (page) => {
    const h1s = Array.from(page.doc.querySelectorAll('h1')).map(h => h.textContent?.trim() || '')
    const visibleH1s = h1s.filter(h => h.length > 0)

    const issues: string[] = []
    const recommendations: string[] = []

    // Check count
    if (visibleH1s.length === 0) {
      issues.push('No H1 headings found')
      recommendations.push('Add at least one H1 heading to structure your content')
    } else if (visibleH1s.length > 1) {
      issues.push(`Multiple H1 headings found (${visibleH1s.length})`)
      recommendations.push('Consider using only one H1 per page for better SEO')
    }

    // Check length
    const firstH1 = visibleH1s[0] || ''
    if (firstH1.length > 0) {
      if (firstH1.length < 20) {
        recommendations.push('H1 could be more descriptive (current: ' + firstH1.length + ' chars)')
      } else if (firstH1.length > 70) {
        recommendations.push('H1 might be too long (current: ' + firstH1.length + ' chars)')
      }
    }

    // Check if H1 matches title
    const title = page.doc.querySelector('title')?.textContent?.trim() || ''
    const titleSimilarity = title && firstH1 ?
      (title.toLowerCase() === firstH1.toLowerCase() ? 'identical' :
       title.toLowerCase().includes(firstH1.toLowerCase()) || firstH1.toLowerCase().includes(title.toLowerCase()) ? 'similar' :
       'different') : 'unknown'

    if (titleSimilarity === 'identical') {
      recommendations.push('H1 is identical to title - consider making them slightly different')
    } else if (titleSimilarity === 'different' && title && firstH1) {
      recommendations.push('H1 and title are very different - consider aligning them')
    }

    // Also check for H2s structure
    const h2s = Array.from(page.doc.querySelectorAll('h2')).map(h => h.textContent?.trim() || '').filter(h => h.length > 0)

    const type = issues.length === 0 ? 'ok' : visibleH1s.length === 0 ? 'error' : 'warn'

    return {
      label: 'BODY',
      message: visibleH1s.length === 0 ? 'No H1 found' :
               visibleH1s.length === 1 ? `H1: ${firstH1}` :
               `${visibleH1s.length} H1s found: ${visibleH1s.slice(0, 2).join(', ')}${visibleH1s.length > 2 ? '...' : ''}`,
      type,
      what: 'static',
      priority: type === 'ok' ? 900 : type === 'warn' ? 450 : 0,
      details: {
        h1s: visibleH1s,
        h2s: h2s.slice(0, 10), // First 10 H2s
        extra: {
          issues: issues.length > 0 ? issues : undefined,
          recommendations: recommendations.length > 0 ? recommendations : undefined,
          titleSimilarity,
          totalH1Count: h1s.length,
          visibleH1Count: visibleH1s.length,
          h2Count: h2s.length,
          firstH1Length: firstH1.length
        }
      }
    }
  },
}