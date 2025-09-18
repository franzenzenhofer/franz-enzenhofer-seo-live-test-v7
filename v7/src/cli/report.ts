type R = { label: string; message: string; type: string }

const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')

export const toHtml = (url: string, rows: R[]) => {
  const items = rows.map(r => `<div class="row"><span class="k">${esc(r.label)}</span><span class="t ${r.type}">${esc(r.type)}</span><div class="m">${r.message}</div></div>`).join('')
  const s = rows.reduce((a: Record<string,number>, r)=>{ a[r.type]=(a[r.type]||0)+1; return a }, {})
  const sum = `ok ${s['ok']||0} · warn ${s['warn']||0} · error ${s['error']||0} · info ${s['info']||0}`
  const css = '.row{border:1px solid #e5e7eb;margin:8px 0;padding:8px;border-radius:6px}.k{font:600 12px system-ui;color:#475569;margin-right:8px}.t{font:600 12px}.t.ok{color:#16a34a}.t.warn{color:#ca8a04}.t.error{color:#dc2626}.m{font:14px system-ui;margin-top:6px;word-break:break-word}'
  return `<!doctype html><meta charset="utf-8"><title>Live Test Report</title><style>${css}</style><h1>Live Test Report</h1><p>URL: ${esc(url)}</p><p>${sum}</p>${items}`
}

export const toHtmlAnchored = (url: string, rows: R[]) => {
  const items = rows.map((r, i) => `<div id="r-i-${i}" class="row"><span class="k">${esc(r.label)}</span><span class="t ${r.type}">${esc(r.type)}</span><div class="m">${r.message}</div></div>`).join('')
  const s = rows.reduce((a: Record<string,number>, r)=>{ a[r.type]=(a[r.type]||0)+1; return a }, {})
  const sum = `ok ${s['ok']||0} · warn ${s['warn']||0} · error ${s['error']||0} · info ${s['info']||0}`
  const css = '.row{border:1px solid #e5e7eb;margin:8px 0;padding:8px;border-radius:6px}.k{font:600 12px system-ui;color:#475569;margin-right:8px}.t{font:600 12px}.t.ok{color:#16a34a}.t.warn{color:#ca8a04}.t.error{color:#dc2626}.m{font:14px system-ui;margin-top:6px;word-break:break-word}'
  return `<!doctype html><meta charset="utf-8"><title>Live Test Report</title><style>${css}</style><h1>Live Test Report</h1><p>URL: ${esc(url)}</p><p>${sum}</p>${items}`
}
