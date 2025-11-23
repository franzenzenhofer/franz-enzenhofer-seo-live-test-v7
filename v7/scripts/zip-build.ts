import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(new URL('..', import.meta.url).pathname)
const distDir = path.join(root, 'dist')
const outDir = path.join(root, 'zip-build')
const zipPath = path.join(outDir, 'latest-build.zip')

const ensureDist = () => {
  if (!fs.existsSync(distDir)) {
    throw new Error('dist/ not found. Run vite build first.')
  }
}

const cleanOut = () => {
  fs.rmSync(outDir, { recursive: true, force: true })
  fs.mkdirSync(outDir, { recursive: true })
}

const createZip = () => {
  execSync(`cd "${distDir}" && zip -qr "${zipPath}" .`, { stdio: 'inherit' })
}

const main = () => {
  ensureDist()
  cleanOut()
  createZip()
  console.log(`Zipped extension to ${zipPath}`)
}

main()
