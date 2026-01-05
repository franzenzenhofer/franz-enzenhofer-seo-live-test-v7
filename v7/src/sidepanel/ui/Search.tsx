import { useEffect, useState } from 'react'

export const Search = ({ onChange }: { onChange: (q: string)=>void }) => {
  const [q, setQ] = useState('')
  useEffect(()=>{ const t = setTimeout(()=> onChange(q.trim()), 150); return ()=> clearTimeout(t) }, [q])
  return (
    <div className="space-y-1">
      <input className="bg-white border rounded px-2 py-1 w-full" placeholder="Filter results (⌘/Ctrl+F)" value={q} onChange={(e)=> setQ(e.target.value)} />
      <p className="text-[10px] text-slate-500">Try: error warn, id:head:canonical, label:head, name:canonical</p>
    </div>
  )
}
