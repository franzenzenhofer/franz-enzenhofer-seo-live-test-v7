import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const cacheRoots = [
  path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright'),
  path.join(os.homedir(), '.cache', 'ms-playwright'),
]
const relativeExecutables = [
  ['chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'],
  ['chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'],
  ['chrome-linux', 'chrome'],
  ['chrome-linux64', 'chrome'],
]

const findCachedChromium = () => {
  for (const root of cacheRoots) {
    if (!fs.existsSync(root)) continue
    const versions = fs.readdirSync(root).filter((name) => /^chromium-\d+$/.test(name))
      .sort((a, b) => Number(a.slice(9)) - Number(b.slice(9)))
    for (const version of versions) {
      for (const parts of relativeExecutables) {
        const candidate = path.join(root, version, ...parts)
        if (!fs.existsSync(candidate)) continue
        const app = candidate.includes('.app/') ? candidate.slice(0, candidate.indexOf('.app/') + 4) : ''
        if (!app || fs.existsSync(path.join(app, 'Contents', 'Frameworks'))) return candidate
      }
    }
  }
  return undefined
}

const candidates = () => [
  process.env['PW_CHROME_PATH'], findCachedChromium(),
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
]

export const browserExecutable = () =>
  candidates().find((candidate): candidate is string => Boolean(candidate && fs.existsSync(candidate)))
