import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('Build Critical Files', () => {
  it('ensures ALL required source files exist', () => {
    const criticalFiles = [
      // HTML entry points
      'src/sidepanel.html',
      'src/report.html',
      'src/settings.html',
      'src/offscreen.html',
      // Main TypeScript entry points
      'src/sidepanel/main.tsx',
      'src/report/main.tsx',
      'src/settings/main.tsx',
      'src/offscreen/main.ts',
      'src/background/index.ts',
      // Main React components
      'src/sidepanel/ui/App.tsx',
      'src/report/ReportApp.tsx',
      'src/settings/SettingsApp.tsx',
      // Critical config files
      'src/manifest.ts',
      'vite.config.ts',
      'tsconfig.json',
      'tailwind.config.ts',
      'package.json'
    ]

    criticalFiles.forEach(file => {
      const path = resolve(process.cwd(), file)
      expect(existsSync(path), `MISSING CRITICAL FILE: ${file}`).toBe(true)
    })
  })

  it('ensures vite.config includes ALL HTML files', () => {
    const viteConfig = readFileSync(
      resolve(process.cwd(), 'vite.config.ts'),
      'utf-8'
    )

    const requiredInputs = ['offscreen', 'report', 'settings']
    requiredInputs.forEach(input => {
      const pattern = new RegExp(`${input}:\\s*r\\(root,\\s*'src/${input}.html'\\)`)
      expect(viteConfig, `Missing in vite.config: ${input}.html`).toMatch(pattern)
    })
  })

  it('ensures manifest.json is valid', () => {
    const manifestPath = resolve(process.cwd(), 'src/manifest.ts')
    expect(existsSync(manifestPath), 'manifest.ts missing').toBe(true)

    const manifest = readFileSync(manifestPath, 'utf-8')
    expect(manifest).toContain('manifest_version: 3')
    expect(manifest).toContain('side_panel')
    expect(manifest).toContain('service_worker')
  })

  it('ensures dist contains ALL built files after build', () => {
    if (!existsSync(resolve(process.cwd(), 'dist'))) {
      console.warn('Skipping dist check - run npm run build first')
      return
    }

    const requiredDistFiles = [
      // HTML files
      'dist/src/sidepanel.html',
      'dist/src/report.html',
      'dist/src/settings.html',
      'dist/src/offscreen.html',
      // Manifest
      'dist/manifest.json',
      // Service worker loader
      'dist/service-worker-loader.js'
    ]

    requiredDistFiles.forEach(file => {
      const path = resolve(process.cwd(), file)
      expect(existsSync(path), `MISSING IN BUILD: ${file}`).toBe(true)
    })
  })

  it('validates HTML files have correct script references', () => {
    const htmlChecks = [
      { file: 'src/sidepanel.html', script: '/src/sidepanel/main.tsx' },
      { file: 'src/report.html', script: '/src/report/main.tsx' },
      { file: 'src/settings.html', script: '/src/settings/main.tsx' },
      { file: 'src/offscreen.html', script: '/src/offscreen/main.ts' }
    ]

    htmlChecks.forEach(({ file, script }) => {
      const content = readFileSync(resolve(process.cwd(), file), 'utf-8')
      expect(content, `${file} missing script: ${script}`).toContain(script)
    })
  })
})