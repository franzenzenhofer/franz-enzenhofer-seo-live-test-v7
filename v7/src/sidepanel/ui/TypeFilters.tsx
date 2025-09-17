export const TypeFilters = ({ show, setShow }: { show: Record<string, boolean>; setShow: (u: (s: Record<string, boolean>) => Record<string, boolean>) => void }) => (
  <div className="text-xs text-slate-600 flex items-center gap-2">
    <label><input type="checkbox" checked={show['ok']} onChange={()=> setShow(s=>({ ...s, ok: !s['ok'] }))} /> ok</label>
    <label><input type="checkbox" checked={show['warn']} onChange={()=> setShow(s=>({ ...s, warn: !s['warn'] }))} /> warn</label>
    <label><input type="checkbox" checked={show['error']} onChange={()=> setShow(s=>({ ...s, error: !s['error'] }))} /> error</label>
    <label><input type="checkbox" checked={show['info']} onChange={()=> setShow(s=>({ ...s, info: !s['info'] }))} /> info</label>
  </div>
)

