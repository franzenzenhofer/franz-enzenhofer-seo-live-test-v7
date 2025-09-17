import fs from 'node:fs/promises'

import { runAllCli } from './runner'
import { loadRules } from './loadRules'
import { fromEnvVariables } from './env'
import { toHtml } from './report'

const ctxOf = (url: string, html: string) => ({ id: Date.now(), ev: [
  { t: 'nav:before', u: url },
  { t: 'nav:commit', u: url },
  { t: 'dom:document_idle', d: { html, location: { href: url } } },
] })

type Opts = { format?: string; out?: string }

export const execUrl = async (url: string, opts: Opts) => {
  const res = await fetch(url); const html = await res.text(); const ctx = ctxOf(url, html)
  const out = await runAllCli(loadRules(), { events: ctx.ev, html, globals: { variables: fromEnvVariables() } })
  return output(url, out as Array<{label:string;message:string;type:string}>, opts)
}

export const execFile = async (path: string, opts: Opts) => {
  const html = await fs.readFile(path, 'utf8'); const url = 'file://' + path; const ctx = ctxOf(url, html)
  const out = await runAllCli(loadRules(), { events: ctx.ev, html, globals: { variables: fromEnvVariables() } })
  return output(url, out as Array<{label:string;message:string;type:string}>, opts)
}

const output = async (url: string, rows: Array<{label:string;message:string;type:string}>, opts: Opts) => {
  if ((opts.format || 'json') === 'html') {
    const r = toHtml(url, rows); if (opts.out) await fs.writeFile(opts.out, r, 'utf8'); else process.stdout.write(r + '\n')
  } else { process.stdout.write(JSON.stringify(rows, null, 2) + '\n') }
}
