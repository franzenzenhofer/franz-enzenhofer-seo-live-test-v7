import type { Rule } from '@/core/types'

export const metaDescriptionEnhancedRule: Rule = {
  id: 'head-meta-description-enhanced',
  name: 'Meta Description Analysis (Enhanced)',
  enabled: true,
  run: async (page) => {
    const nodes = page.doc.querySelectorAll('meta[name="description"]')

    if (nodes.length === 0) {
      return {
        label: 'HEAD',
        message: 'No meta description found.',
        type: 'error',
        what: 'static',
        priority: 0,
        details: {
          description: '',
          descriptionLength: 0,
          extra: {
            issues: ['No meta description tag found'],
            recommendations: ['Add a meta description tag to improve click-through rates']
          }
        }
      }
    }

    if (nodes.length > 1) {
      const descriptions = Array.from(nodes).map(n => (n as HTMLMetaElement).content)
      return {
        label: 'HEAD',
        message: `Multiple meta descriptions found (${nodes.length})`,
        type: 'error',
        what: 'static',
        priority: 0,
        details: {
          description: descriptions[0],
          descriptionLength: descriptions[0]?.length || 0,
          extra: {
            issues: [`Found ${nodes.length} meta description tags`],
            allDescriptions: descriptions
          }
        }
      }
    }

    const content = (nodes[0] as HTMLMetaElement).content || ''
    const length = content.length

    const issues: string[] = []
    const recommendations: string[] = []

    // Check length
    if (length === 0) {
      issues.push('Meta description is empty')
      recommendations.push('Add a compelling description of the page content')
    } else if (length < 120) {
      issues.push(`Description too short (${length} chars, recommended 120-160)`)
      recommendations.push('Consider adding more detail to fully utilize space')
    } else if (length > 160) {
      issues.push(`Description too long (${length} chars, may be truncated)`)
      recommendations.push('Consider shortening to under 160 characters')
    }

    // Check for duplicate content with title
    const title = page.doc.querySelector('title')?.textContent?.trim() || ''
    if (title && content.toLowerCase().includes(title.toLowerCase())) {
      recommendations.push('Description contains the title - consider more unique content')
    }

    // Check for call-to-action
    const ctaWords = /\b(learn|discover|find|get|try|see|read|explore|shop|buy)\b/i
    if (!ctaWords.test(content)) {
      recommendations.push('Consider adding a call-to-action word')
    }

    // Check for special characters
    const hasSpecialChars = /[""''…—–]/.test(content)
    if (hasSpecialChars) {
      issues.push('Contains special characters that may not display correctly')
    }

    const type = issues.length === 0 && length > 0 ? 'ok' :
                 length === 0 || nodes.length > 1 ? 'error' : 'warn'

    return {
      label: 'HEAD',
      message: `Meta description: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''} (${length} chars)`,
      type,
      what: 'static',
      priority: type === 'ok' ? 760 : type === 'warn' ? 380 : 0,
      details: {
        description: content,
        descriptionLength: length,
        extra: {
          issues: issues.length > 0 ? issues : undefined,
          recommendations: recommendations.length > 0 ? recommendations : undefined,
          words: content.split(/\s+/).length,
          hasCallToAction: ctaWords.test(content)
        }
      }
    }
  },
}