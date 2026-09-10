import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { build } from 'esbuild'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'

const dir = path.dirname(fileURLToPath(import.meta.url))
const bundle = await build({ entryPoints: [path.join(dir, 'app.mjs')], bundle: true, write: false, format: 'iife', minify: true })
const shell = await readFile(path.join(dir, 'shell.html'), 'utf8')
await writeFile(path.join(dir, 'index.html'), shell.replace('/* APP_BUNDLE */', () => bundle.outputFiles[0].text.replaceAll('</script>', '<\\/script>')))
const css = await postcss([tailwindcss({ content: [path.join(dir, '*.{html,mjs}')], theme: { extend: {} }, plugins: [] })])
  .process('@tailwind base; @tailwind components; @tailwind utilities;', { from: undefined })
await writeFile(path.join(dir, 'tailwind.css'), css.css)
console.log('Built standalone result template; no extension files changed.')
