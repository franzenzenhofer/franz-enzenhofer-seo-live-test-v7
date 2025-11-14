import path from 'node:path'
import { spawn } from 'node:child_process'

import { resolveChromeProfileSource, resolveChromeExecutable } from './chrome-profile'

const profile = resolveChromeProfileSource()

if (!profile) {
  console.error('Set LT_CHROME_PROFILE_NAME or LT_CHROME_PROFILE_DIR to launch a profile.')
  process.exit(1)
}

const chromeExecutable = resolveChromeExecutable()
const profileDirName = path.basename(profile)
const url = process.env.LT_CHROME_PROFILE_URL || 'chrome://extensions/'

const child = spawn(chromeExecutable, [`--profile-directory=${profileDirName}`, url], {
  detached: true,
  stdio: 'ignore',
})

child.unref()
console.log(`Launched Chrome profile "${profileDirName}" via ${chromeExecutable}`)
