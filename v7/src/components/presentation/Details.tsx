import { Fields } from './Fields'

import type { Result } from '@/core/types'
import type { Presentation } from '@/shared/presentation/schema'

export const Details = ({ view, result }: { view: Presentation; result: Result }) => {
  const shown = new Set(view.values.filter((field) => field.kind === 'original').map((field) => field.value))
  const remaining = view.markup.filter((field) => !shown.has(field.value))
  return <>
    {!!view.detailValues.length && <section aria-label="Extracted values"><Fields fields={view.detailValues} pageUrl={view.pageUrl} /></section>}
    <section aria-label="Check performed"><Fields fields={view.checked} pageUrl={view.pageUrl} /></section>
    {!!view.evidence.length && <section className="space-y-2 border-t border-slate-200/80 pt-2" aria-label="Evidence">
      <h3 className="text-sm font-semibold text-slate-900">Evidence</h3>
      {view.evidence.map((record, index) => <section key={index} className="space-y-1.5">
        <h4 className="text-sm font-medium text-slate-800">{record.name}</h4><Fields fields={record.fields} pageUrl={view.pageUrl} />
      </section>)}
    </section>}
    {(!view.markup.length || remaining.length > 0) && <section className="space-y-1.5 border-t border-slate-200/80 pt-2">
      <h3 className="text-sm font-semibold text-slate-900">Retrieved markup</h3>
      {remaining.length ? <Fields fields={remaining} pageUrl={view.pageUrl} /> : <p className="text-sm text-slate-600">{view.noMarkup}</p>}
    </section>}
    <section className="space-y-1 border-t border-slate-200/80 pt-2" aria-label="References">
      <h3 className="text-sm font-semibold text-slate-900">References</h3>
      <ul className="space-y-1">{view.references.map((url, index) => <li key={index} className="text-sm [overflow-wrap:anywhere]">
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline underline-offset-2" data-reference-url>{url}</a>
      </li>)}</ul>
    </section>
    <footer className="border-t border-slate-200/80 pt-2" aria-label="Rule metadata">
      <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs leading-5 text-slate-600">
        {[['Rule ID', result.ruleId], ['Run position', result.runIndex], ['Sort priority', result.priority]].map(([key, value]) => <div key={key} className="flex gap-1"><dt>{key}:</dt><dd className="font-mono [overflow-wrap:anywhere]">{value ?? 'Not assigned'}</dd></div>)}
      </dl>
    </footer>
  </>
}
