import { describe, it, expect } from 'vitest'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { execFile } from '@/cli/exec'

describe('cli --out', () => {
  it('writes JSON to the output file instead of stdout', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'cli-out-'))
    const page = path.join(dir, 'page.html')
    const out = path.join(dir, 'report.json')
    await fs.writeFile(page, '<!doctype html><head><title>Hi</title></head><body><h1>Hi</h1></body>', 'utf8')

    await execFile(page, { format: 'json', out })

    const written = JSON.parse(await fs.readFile(out, 'utf8'))
    expect(Array.isArray(written)).toBe(true)
    expect(written.length).toBeGreaterThan(0)
  })
})
