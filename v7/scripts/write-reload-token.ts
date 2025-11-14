import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const out = resolve(process.cwd(), 'dist/dev-reload.json')
mkdirSync(dirname(out), { recursive: true })
const payload = JSON.stringify({ updatedAt: Date.now() })
writeFileSync(out, payload)
console.log(`[dev-reload] wrote token ${payload}`)
