export const FilterTips = () => (
  <details className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
    <summary className="cursor-pointer select-none text-xs font-semibold text-slate-700">Filter tips</summary>
    <div className="mt-1 space-y-1">
      <div>
        <span className="font-semibold">Tokens:</span>{' '}
        <span className="font-mono">id:</span>, <span className="font-mono">label:</span>,{' '}
        <span className="font-mono">name:</span>, <span className="font-mono">rule:</span>
      </div>
      <div>
        <span className="font-semibold">Types:</span> error, warn, info, ok, runtime, disabled, pending, unconfigured
      </div>
      <div>
        <span className="font-semibold">Examples:</span>{' '}
        <span className="font-mono">label:head warn</span>, <span className="font-mono">id:canonical</span>
      </div>
      <div>
        <span className="font-semibold">Shortcut:</span> Alt-click a type to solo it
      </div>
    </div>
  </details>
)
