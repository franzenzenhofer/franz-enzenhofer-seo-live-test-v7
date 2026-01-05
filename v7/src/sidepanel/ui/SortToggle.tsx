import type { ResultSortMode } from './resultSort'

export const SortToggle = ({ mode, onChange }: { mode: ResultSortMode; onChange: (mode: ResultSortMode) => void }) => (
  <div className="flex items-center gap-1 text-[10px] text-slate-500">
    <span>Sort</span>
    <button
      className={`rounded px-1.5 py-0.5 ${mode === 'priority' ? 'bg-slate-200 text-slate-800' : 'bg-white text-slate-500'}`}
      onClick={() => onChange('priority')}
      type="button"
    >
      Priority
    </button>
    <button
      className={`rounded px-1.5 py-0.5 ${mode === 'name' ? 'bg-slate-200 text-slate-800' : 'bg-white text-slate-500'}`}
      onClick={() => onChange('name')}
      type="button"
    >
      Name
    </button>
  </div>
)
