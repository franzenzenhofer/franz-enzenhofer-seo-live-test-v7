export type Tab = 'results'|'report'|'logs'|'settings'

export const TabStrip = ({ tab, setTab }: { tab: Tab; setTab: (t: Tab)=>void }) => (
  <div role="tablist" className="dt-toolbar flex gap-3 text-sm">
    {(['results','report','logs','settings'] as Tab[]).map((t)=> {
      const label = t.charAt(0).toUpperCase()+t.slice(1)
      const cls = (tab===t? 'underline' : 'opacity-80')+ ' capitalize'
      return (
        <button key={t} role="tab" aria-selected={tab===t} className={cls} onClick={()=> setTab(t)}>
          {label}
        </button>
      )
    })}
  </div>
)
