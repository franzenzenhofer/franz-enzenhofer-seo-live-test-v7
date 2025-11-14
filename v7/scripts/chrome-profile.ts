import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

type ProfileMode = 'temp' | 'clone' | 'live'

export type ProfileChoice = {
  userDataDir: string
  mode: ProfileMode
  source?: string
}

const expandHome = (value: string) => (value.startsWith('~') ? path.join(os.homedir(), value.slice(1)) : value)

const baseDirForPlatform = () => {
  if (process.platform === 'darwin') return path.join(os.homedir(), 'Library/Application Support/Google/Chrome')
  if (process.platform === 'linux') return path.join(os.homedir(), '.config/google-chrome')
  if (process.platform === 'win32') {
    const local = process.env.LOCALAPPDATA
    if (!local) return null
    return path.join(local, 'Google/Chrome/User Data')
  }
  return null
}

export const resolveChromeProfileSource = (): string | null => {
  const dirEnv = process.env.LT_CHROME_PROFILE_DIR
  if (dirEnv) {
    const expanded = expandHome(dirEnv)
    if (!fs.existsSync(expanded)) throw new Error(`LT_CHROME_PROFILE_DIR points to missing path: ${expanded}`)
    return expanded
  }
  const name = process.env.LT_CHROME_PROFILE_NAME
  if (!name) return null
  const base = baseDirForPlatform()
  if (!base) throw new Error('Unsupported platform: set LT_CHROME_PROFILE_DIR instead')
  const target = path.join(base, name)
  if (!fs.existsSync(target)) throw new Error(`Chrome profile "${name}" not found at ${target}`)
  return target
}

export const prepareProfileDir = (): ProfileChoice => {
  const source = resolveChromeProfileSource()
  const keepLive = process.env.LT_CHROME_PROFILE_MODE === 'live'
  if (source) {
    if (keepLive) return { userDataDir: source, mode: 'live', source }
    const clone = fs.mkdtempSync(path.join(os.tmpdir(), 'livetest-profile-'))
    fs.cpSync(source, clone, { recursive: true })
    return { userDataDir: clone, mode: 'clone', source }
  }
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'livetest-profile-'))
  return { userDataDir: tempDir, mode: 'temp' }
}

export const cleanupProfileDir = (choice: ProfileChoice) => {
  if (choice.mode === 'live') return
  if (process.env.LT_CHROME_PROFILE_KEEP === '1') return
  fs.rmSync(choice.userDataDir, { recursive: true, force: true })
}

export const describeProfileChoice = (choice: ProfileChoice) => {
  if (choice.mode === 'temp') return 'temporary profile'
  if (choice.mode === 'clone') return `clone of ${choice.source}`
  return `live profile ${choice.source}`
}

export const resolveChromeExecutable = () => {
  if (process.env.LT_CHROME_APP) return expandHome(process.env.LT_CHROME_APP)
  if (process.platform === 'darwin') return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  if (process.platform === 'linux') return 'google-chrome'
  if (process.platform === 'win32') {
    const programFiles = process.env['PROGRAMFILES(X86)'] || process.env.PROGRAMFILES
    if (!programFiles) throw new Error('Cannot infer Chrome path on Windows; set LT_CHROME_APP')
    return path.join(programFiles, 'Google/Chrome/Application/chrome.exe')
  }
  throw new Error('Unsupported platform; set LT_CHROME_APP')
}
