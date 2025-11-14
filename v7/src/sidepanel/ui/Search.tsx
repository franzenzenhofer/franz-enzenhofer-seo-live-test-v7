import { useEffect, useState } from 'react'

export const Search = ({ onChange }: { onChange: (q: string)=>void }) => {
  const [q, setQ] = useState('')
  useEffect(()=>{ const t = setTimeout(()=> onChange(q.trim()), 150); return ()=> clearTimeout(t) }, [q])
  return (
    <input className="bg-white border rounded px-2 py-1 w-full" placeholder="Filter results (⌘/Ctrl+F)" value={q} onChange={(e)=> setQ(e.target.value)} />
  )
}

