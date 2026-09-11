import { textField, urlField } from '@/shared/presentation/create'
import type { DisplayField } from '@/shared/presentation/schema'
import type { ResourceIssue } from '@/shared/resourceIssues'

const EXCERPT_LIMIT = 200

// Element-derived text (alt/aria-label/title/id/name, or a decoded filename) shown
// in evidence must stay a bounded, clearly labelled excerpt - never an implied
// complete original value. Original markup, when retained, lives in `markup`.
export const excerpt = (value: string): string =>
  value.length > EXCERPT_LIMIT ? `${value.slice(0, EXCERPT_LIMIT)} [truncated]` : value

export const issueRecord = (issue: ResourceIssue, index: number, prefix: string): { name: string; fields: DisplayField[] } => ({
  name: `${prefix} ${index + 1}`,
  fields: [
    textField('Kind', issue.kind),
    textField('Element label (excerpt)', excerpt(issue.name)),
    urlField('HTTP URL', issue.url),
    textField('Location', issue.location),
    ...(issue.selector ? [textField('DOM path', issue.selector)] : []),
  ],
})
