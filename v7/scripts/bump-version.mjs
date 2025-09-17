#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pkgPath = path.resolve(__dirname, '..', 'package.json')
const raw = fs.readFileSync(pkgPath, 'utf8')
const json = JSON.parse(raw)

if (!json.version || typeof json.version !== 'string') {
  console.error('v7/package.json missing valid version')
  process.exit(1)
}

const bumpPatch = (v) => {
  const m = v.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.*))?$/)
  if (!m) throw new Error(`Invalid semver: ${v}`)
  const major = Number(m[1])
  const minor = Number(m[2])
  const patch = Number(m[3]) + 1
  return `${major}.${minor}.${patch}`
}

const next = bumpPatch(json.version)
json.version = next
fs.writeFileSync(pkgPath, JSON.stringify(json, null, 2) + '\n')

// Print for logs and let caller add to commit.
console.log(`bumped v7 version: ${next}`)
