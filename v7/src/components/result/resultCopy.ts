import type { Result } from '@/shared/results'

const codeBlock = (label: string, content: string, lang = '') => {
  const trimmed = content.trim()
  if (!trimmed) return ''
  return `**${label}:**\n\`\`\`${lang}\n${trimmed}\n\`\`\`\n`
}

const linkLine = (label: string, value: string) => {
  if (!value.trim()) return ''
  return `**${label}:** ${value.startsWith('http') ? `<${value}>` : value}\n`
}

export const toResultCopyPayload = (result: Result | null | undefined): string => {
  if (!result) return ''
  const lines: string[] = []
  const header = `### ${result.label}: ${result.name}${result.what ? ` (\`${result.what}\`)` : ''}`
  lines.push(header, '')
  lines.push(`- Type: \`${result.type}\``)
  if (result.ruleId) lines.push(`- Rule ID: \`${result.ruleId}\``)
  if (typeof result.priority === 'number') lines.push(`- Priority: ${result.priority}`)
  lines.push('')
  lines.push(`**Message:** ${result.message}`)
  const details = result.details || {}
  const snippet = typeof details['snippet'] === 'string' ? details['snippet'] : ''
  if (snippet) lines.push('', codeBlock('Snippet', snippet, 'html'))
  const reference = typeof details['reference'] === 'string' ? details['reference'] : ''
  if (reference) lines.push('', linkLine('Reference', reference))
  const sourceHtml = typeof details['sourceHtml'] === 'string' ? details['sourceHtml'] : ''
  if (sourceHtml) lines.push('', codeBlock('Source HTML', sourceHtml, 'html'))
  const extraEntries = Object.entries(details).filter(
    ([key]) => !['snippet', 'reference', 'sourceHtml', 'domPath', 'domPaths'].includes(key),
  )
  for (const [key, value] of extraEntries) {
    if (typeof value === 'string') {
      if (value.startsWith('http')) {
        lines.push('', linkLine(key, value))
      } else if (value.includes('<') && value.includes('>')) {
        lines.push('', codeBlock(key, value, 'html'))
      } else {
        lines.push('', `**${key}:** ${value}`)
      }
    }
  }
  return lines.filter(Boolean).join('\n').trim()
}
