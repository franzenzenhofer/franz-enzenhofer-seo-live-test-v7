import type { Result } from '@/shared/results'
import { readResourceIssues, resourceIssueCopy } from '@/shared/resourceIssues'
import { navigationStepsCopy, readNavigationSteps } from '@/shared/navigationSteps'
import { detailLabel, readableDetail } from '@/shared/readableDetails'
import { markdownCode } from '@/shared/markdownFormatting'
import { presentationCopy } from '@/shared/presentation/copy'

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
  if (result.presentation) return presentationCopy(result)
  const lines: string[] = []
  const header = `### ${result.label}: ${result.name}${result.what ? ` (\`${result.what}\`)` : ''}`
  lines.push(header, '')
  lines.push(`- Type: \`${result.type}\``)
  if (result.ruleId) lines.push(`- Rule ID: \`${result.ruleId}\``)
  if (typeof result.priority === 'number') lines.push(`- Priority: ${result.priority}`)
  lines.push('')
  lines.push(`**Message:** ${result.message}`)
  const details = result.details || {}
  const issues = readResourceIssues(details['resourceIssues'])
  if (issues.length) lines.push('', '**What to fix:**', ...issues.map(resourceIssueCopy))
  const steps = readNavigationSteps(details['navigationSteps'])
  if (steps.length) lines.push('', '**Navigation journey:**', navigationStepsCopy(steps))
  const snippet = typeof details['snippet'] === 'string' ? details['snippet'] : ''
  if (snippet) lines.push('', codeBlock('Snippet', snippet, 'html'))
  const reference = typeof details['reference'] === 'string' ? details['reference'] : ''
  if (reference) lines.push('', linkLine('Reference', reference))
  const sourceHtml = typeof details['sourceHtml'] === 'string' ? details['sourceHtml'] : ''
  if (sourceHtml) lines.push('', codeBlock('Source HTML', sourceHtml, 'html'))
  const extraEntries = Object.entries(details).filter(
    ([key]) => !['snippet', 'reference', 'provenance', 'sourceHtml', ...(issues.length ? ['resourceIssues'] : []), ...(steps.length ? ['issue', 'navigationSteps'] : [])].includes(key),
  )
  for (const [key, value] of extraEntries) {
    const text = readableDetail(value)
    if (!text) continue
    if (typeof value !== 'string') {
      lines.push('', `**${detailLabel(key)}:**\n${markdownCode(text)}`)
    } else {
      if (value.startsWith('http')) {
        lines.push('', linkLine(key, value))
      } else if (value.includes('<') && value.includes('>')) {
        lines.push('', codeBlock(key, value, 'html'))
      } else {
        lines.push('', `**${detailLabel(key)}:** ${value}`)
      }
    }
  }
  return lines.filter(Boolean).join('\n').trim()
}
