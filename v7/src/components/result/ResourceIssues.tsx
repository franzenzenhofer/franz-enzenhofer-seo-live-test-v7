import { DetailCopyButton } from './DetailCopyButton'

import { resourceIssueCopy, resourceIssueFix } from '@/shared/resourceIssues'
import type { ResourceIssue } from '@/shared/resourceIssues'

export const ResourceIssues = ({ issues }: { issues: ResourceIssue[] }) => (
  <section aria-label="Offending resources" className="space-y-3 text-base">
    <h3 className="font-semibold text-slate-900">What to fix</h3>
    <ol className="space-y-3">
      {issues.map((issue, index) => (
        <li key={`${index}:${issue.url}`} className="space-y-3 rounded-lg border border-slate-200 bg-white p-3" data-testid="resource-issue">
          <div>
            <p className="font-semibold text-slate-900">{index + 1}. {issue.kind}: {issue.name}</p>
            <p className="mt-1 text-slate-600">{issue.location}</p>
          </div>
          <div>
            <p className="font-medium text-slate-600">HTTP URL</p>
            <code className="block break-all text-base text-red-800">{issue.url}</code>
          </div>
          <p className="text-slate-800"><span className="font-semibold text-emerald-800">Fix:</span> {resourceIssueFix(issue)}</p>
          <div className="flex flex-wrap gap-2">
            <DetailCopyButton value={resourceIssueCopy(issue, index)}>Copy offender</DetailCopyButton>
            <DetailCopyButton value={issue.url}>Copy URL</DetailCopyButton>
            {issue.selector && <DetailCopyButton value={issue.selector}>Copy CSS selector</DetailCopyButton>}
          </div>
        </li>
      ))}
    </ol>
  </section>
)
