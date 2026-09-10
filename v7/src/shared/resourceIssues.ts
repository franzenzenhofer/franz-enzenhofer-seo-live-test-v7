import { z } from 'zod'

import { escapeMarkdown, markdownCode } from './markdownFormatting'

const resourceIssueSchema = z.object({
  name: z.string(), kind: z.string(), url: z.string(), location: z.string(),
  selector: z.string().optional(),
})
export type ResourceIssue = z.infer<typeof resourceIssueSchema>
export const readResourceIssues = (value: unknown): ResourceIssue[] => {
  const parsed = z.array(resourceIssueSchema).safeParse(value)
  return parsed.success ? parsed.data : []
}
export const resourceIssueFix = (issue: ResourceIssue): string => issue.selector
  ? `Change ${issue.location} to an HTTPS URL.`
  : 'Update the code or third-party configuration that requests this URL to use HTTPS.'

export const resourceIssueCopy = (issue: ResourceIssue, index: number): string => [
  `#### ${index + 1}. ${escapeMarkdown(issue.kind)}: ${escapeMarkdown(issue.name)}`,
  `**Where:** ${escapeMarkdown(issue.location)}`,
  `**HTTP URL:**\n${markdownCode(issue.url)}`,
  ...(issue.selector ? [`**Find in page (CSS selector):**\n${markdownCode(issue.selector)}`] : []),
  `**Fix:** ${escapeMarkdown(resourceIssueFix(issue))} Verify that the HTTPS endpoint works; otherwise replace or remove the resource.`,
].join('\n\n')
