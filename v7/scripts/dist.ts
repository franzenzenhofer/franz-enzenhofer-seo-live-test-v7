import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(new URL('..', import.meta.url).pathname)
const dist = path.join(root, 'dist')
const out = path.join(root, 'out')

const cp = (src: string, dst: string) => {
  const st = fs.statSync(src)
  if (st.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true })
    for (const f of fs.readdirSync(src)) cp(path.join(src, f), path.join(dst, f))
  } else {
    fs.mkdirSync(path.dirname(dst), { recursive: true })
    fs.copyFileSync(src, dst)
  }
}

const write = (p: string, s: string) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s, 'utf8') }

const main = () => {
  if (!fs.existsSync(dist)) throw new Error('Build first (dist missing)')
  fs.rmSync(out, { recursive: true, force: true })
  fs.mkdirSync(out, { recursive: true })
  // Extension bundle
  cp(dist, path.join(out, 'extension'))
  try { cp(path.join(root, 'dist.zip'), path.join(out, 'extension.zip')) } catch {}
  // Marketing
  if (fs.existsSync(path.join(root, 'marketing'))) cp(path.join(root, 'marketing'), path.join(out, 'marketing'))
  // Landing page
  const html = `<!doctype html><meta charset="utf-8"><title>Live Test (Install)</title><style>body{font:16px system-ui;margin:40px auto;max-width:720px;line-height:1.5}a{color:#2563eb}</style><h1>F19N Obtrusive Live Test v7</h1><p>Install the Chrome extension from the Chrome Web Store (or load unpacked from the extension folder).</p><ol><li>Open chrome://extensions, enable Developer mode.</li><li>Click "Load unpacked" and select the "extension" folder in this package.</li><li>Pin the extension and open the side panel on any page.</li></ol><p>CI build artifacts include a zip (extension.zip). For the Web Store, use the marketing assets in this package.</p><h2>CLI</h2><pre>npm run -w v7 cli -- url https://example.com -f html -o report.html</pre><h2>Keys & Tokens</h2><p>Open the side panel Settings and set Google API keys (PSI, MFT) and GSC site URL. Sign in with Google for GSC rules.</p>`
  write(path.join(out, 'landing', 'index.html'), html)
  // README
  write(path.join(out, 'README.txt'), 'Package contents:\nextension/ (MV3 build)\nextension.zip (if present)\nmarketing/ (store listing assets)\nlanding/index.html (simple install page)\n')
  console.log('Created release bundle in', out)
}

main()
