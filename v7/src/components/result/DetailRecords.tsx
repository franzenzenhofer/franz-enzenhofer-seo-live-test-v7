import { DetailCopyButton } from './DetailCopyButton'

import { detailEntries, detailLabel, isDetailRecord, readableDetail } from '@/shared/readableDetails'

export type RecordDetail = { key: string; value: unknown }
const Value = ({ value }: { value: unknown }) => {
  if (Array.isArray(value)) return <ol className="space-y-3">
    {value.map((item, index) => <li key={index} className="rounded border border-slate-200 bg-white p-3">
      {typeof item === 'object' && <p className="mb-2 font-semibold text-slate-500">{index + 1}</p>}
      <Value value={item} />
    </li>)}
  </ol>
  if (isDetailRecord(value)) return <dl className="space-y-2">
    {detailEntries(value).map(([key, item]) => <div key={key}>
      <dt className="font-medium text-slate-500">{detailLabel(key)}</dt>
      <dd className="break-words text-slate-900"><Value value={item} /></dd>
    </div>)}
  </dl>
  return <span className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{readableDetail(value)}</span>
}
export const DetailRecords = ({ entries }: { entries: RecordDetail[] }) => <>
  {entries.map(({ key, value }) => <section key={key} className="space-y-3 text-base" data-testid="detail-records">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="font-semibold text-slate-800">{detailLabel(key)}</h3>
      <DetailCopyButton value={readableDetail(value)}>Copy evidence</DetailCopyButton>
    </div>
    <Value value={value} />
  </section>)}
</>
