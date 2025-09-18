import { useEffect, useState } from 'react'

import { ReportView } from './ReportView'

import { getActiveTabId } from '@/shared/chrome'
import { readResults, watchResults, type Result } from '@/shared/results'

export const ReportContainer = ({ url, index, onClose }: { url: string; index?: number; onClose: ()=>void }) => {
  const [rows, setRows] = useState<Result[]>([])
  useEffect(() => {
    let unsub: (()=>void)|null = null
    getActiveTabId().then((id)=>{ if(!id) return; readResults(id).then(setRows).catch(()=>{}); unsub = watchResults(id, setRows) }).catch(()=>{})
    return ()=> { unsub?.() }
  }, [])
  return <ReportView url={url} rows={rows} anchor={index} onClose={onClose} />
}
