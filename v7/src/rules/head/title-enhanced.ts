import type { Rule } from '@/core/types'

export const titleEnhancedRule: Rule = {
  id: 'head-title-enhanced',
  name: 'Title Analysis (Enhanced)',
  enabled: true,
  run: async (page) => {
    const titleEl = page.doc.querySelector('head > title')
    const title = titleEl?.textContent?.trim() || ''
    const length = title.length

    // Analyze title quality
    const issues: string[] = []
    const recommendations: string[] = []

    if (length === 0) {
      issues.push('No title tag found')
      return {
        label: 'HEAD',
        message: 'No title-tag found in head.',
        type: 'error',
        what: 'static',
        priority: 0,
        details: {
          title: '',
          titleLength: 0,
          extra: { issues, recommendations }
        }
      }
    }

    // Check length
    if (length < 30) {
      issues.push(`Title too short (${length} chars, recommended 30-60)`)
      recommendations.push('Consider adding more descriptive keywords')
    } else if (length > 60) {
      issues.push(`Title too long (${length} chars, may be truncated in search results)`)
      recommendations.push('Consider shortening to under 60 characters')
    }

    // Check for duplicate words
    const words = title.toLowerCase().split(/\s+/)
    const duplicates = words.filter((w, i) => words.indexOf(w) !== i && w.length > 3)
    if (duplicates.length > 0) {
      issues.push(`Duplicate words found: ${[...new Set(duplicates)].join(', ')}`)
    }

    // Check for special characters
    if (/[|–-]/.test(title)) {
      recommendations.push('Title contains separators which is good for branding')
    }

    // Check for stop words at start
    if (/^(the|a|an|in|on|at|to|for)\s/i.test(title)) {
      recommendations.push('Consider starting with more important keywords')
    }

    const type = issues.length === 0 ? 'ok' : length === 0 ? 'error' : 'warn'

    return {
      label: 'HEAD',
      message: `SEO-<title>: ${title} (${length} chars)`,
      type,
      what: 'static',
      priority: type === 'ok' ? 1000 : type === 'warn' ? 500 : 0,
      details: {
        title,
        titleLength: length,
        extra: {
          issues: issues.length > 0 ? issues : undefined,
          recommendations: recommendations.length > 0 ? recommendations : undefined,
          words: words.length,
          uniqueWords: [...new Set(words)].length
        }
      }
    }
  },
}