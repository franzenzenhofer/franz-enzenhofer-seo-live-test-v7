type Props = {
  selector: string
  extraCount?: number
}

export const ResultDomPath = ({ selector, extraCount = 0 }: Props) => (
  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
    <span className="uppercase tracking-wide text-[10px] text-slate-500">DOM PATH</span>
    <code className="px-2 py-0.5 rounded border bg-white/60 text-[10px] text-slate-700 break-all whitespace-pre-wrap">
      {selector}
    </code>
    {extraCount > 0 && <span className="text-[10px] text-slate-500">+{extraCount} more</span>}
  </div>
)
