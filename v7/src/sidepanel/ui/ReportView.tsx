import { useEffect, useMemo, useRef } from 'react'

import { toHtmlAnchored } from '@/cli/report'

export const ReportView = ({ url, rows, anchor, onClose }: { url: string; rows: Array<{label:string;message:string;type:string}>; anchor?: number; onClose: ()=>void }) => {
  const html = useMemo(()=> toHtmlAnchored(url, rows), [url, rows])
  const ref = useRef<HTMLIFrameElement>(null)
  useEffect(()=>{
    const id = typeof anchor==='number' ? `#r-i-${anchor}` : ''
    const t = setTimeout(()=>{ try{ const d = ref.current?.contentWindow?.document; if(d && id){ d.location.hash=id } }catch{ /* ignore */ } }, 50)
    return ()=> clearTimeout(t)
  }, [anchor])
  const copy = async () => { await navigator.clipboard.writeText(html) }
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <button className="underline" onClick={onClose}>Back</button>
        <button className="underline" onClick={copy}>Copy HTML</button>
      </div>
      <iframe ref={ref} className="w-full h-[480px] border" srcDoc={html} />
    </div>
  )
}
