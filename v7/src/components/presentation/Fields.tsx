import { useId } from 'react'

import { PathValue } from './PathValue'

import type { DisplayField } from '@/shared/presentation/schema'

const hrefFor = (value: string, pageUrl: string) => {
  try { const url = new URL(value, pageUrl); return /^https?:$/.test(url.protocol) ? url.href : null } catch { return null }
}
const LinkedText = ({ value, pageUrl, isUrl }: { value: string; pageUrl: string; isUrl: boolean }) => {
  const parts = isUrl ? [value] : value.split(/(https?:\/\/[^\s<>]+)/g)
  return <>{parts.map((part, index) => {
    const href = isUrl || /^https?:\/\//i.test(part) ? hrefFor(part, pageUrl) : null
    return href ? <a key={index} href={href} target="_blank" rel="noopener noreferrer" className="text-inherit no-underline hover:bg-slate-100 focus-visible:outline" data-data-url>{part}</a> : part
  })}</>
}
export const Fields = ({ fields, pageUrl }: { fields: DisplayField[]; pageUrl: string }) => {
  const id = useId()
  return <dl className="space-y-1.5">{fields.map((field, index) => {
    const original = field.kind === 'original'
    const fieldId = `${id}-${index}`
    // The row wraps: a value keeps at least 10rem beside its label or moves to its own full-width line,
    // so a long label can never squeeze the value into a one-word-per-line sliver.
    return <div key={index} data-field-row className={original ? '' : 'flex flex-wrap items-baseline gap-x-2 gap-y-0.5'}>
      <dt className={`${original ? 'mb-1' : 'shrink-0'} text-sm leading-5 text-slate-600`}>
        {original ? <label htmlFor={fieldId}>{field.key}:</label> : `${field.key}:`}
      </dt>
      <dd className="min-w-0 grow basis-40 whitespace-pre-wrap text-sm leading-5 text-slate-950 [overflow-wrap:anywhere]">
        {original ? <textarea id={fieldId} readOnly value={field.value} rows={2} className="block w-full resize-y [field-sizing:content] rounded-lg border border-slate-300 bg-white/90 px-2 py-1.5 text-sm leading-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-700" />
          : field.kind === 'path' ? <PathValue value={field.value} />
          : <LinkedText value={String(field.value)} pageUrl={pageUrl} isUrl={field.kind === 'url'} />}
      </dd>
    </div>
  })}</dl>
}
