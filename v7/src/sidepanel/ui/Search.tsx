import { useEffect, useState } from 'react'

const FILTER_HINT = [
  'Filter tips',
  'Types: error warn info ok runtime pending disabled',
  'Tokens: id:head:canonical, label:head, name:canonical, rule:',
  'Priority: p<200, p>=400, priority:100-300',
  'Alt-click a type chip to solo it',
].join('\n')

export const Search = ({ onChange }: { onChange: (q: string)=>void }) => {
  const [q, setQ] = useState('')
  useEffect(()=>{ const t = setTimeout(()=> onChange(q.trim()), 150); return ()=> clearTimeout(t) }, [q])
  return (
    <input
      className="bg-white border rounded px-2 py-1 w-full"
      placeholder="Filter results (⌘/Ctrl+F)"
      title={FILTER_HINT}
      value={q}
      onChange={(e)=> setQ(e.target.value)}
    />
  )
}
