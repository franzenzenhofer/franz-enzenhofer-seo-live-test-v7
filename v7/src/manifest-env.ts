import fs from 'node:fs'
import path from 'node:path'

const DEFAULT_DEV_CLIENT_ID = '335346275770-p8vif5hh6sj238tq5bh1rmble8r1e9pt.apps.googleusercontent.com'

export const detectLegacyClientId = (): string | undefined => {
  const env = process.env['GOOGLE_OAUTH_CLIENT_ID'] || process.env['GOOGLE_APP_CLIENT_ID']
  if (env && env.trim()) return env.trim()
  const base = process.cwd()
  const cand = [
    path.resolve(base, '../f19n-obtrusive-livetest/build/manifest.json'),
    path.resolve(base, '../f19n-obtrusive-livetest/dist/manifest.json'),
    path.resolve(base, '../f19n-obtrusive-livetest/src/public/manifest.json'),
  ]
  for (const p of cand) {
    try {
      if (!fs.existsSync(p)) continue
      const json = JSON.parse(fs.readFileSync(p, 'utf8'))
      const id = json?.oauth2?.client_id as string | undefined
      if (id && !id.includes('will be set')) return id
    } catch {/* ignore */}
  }
  return DEFAULT_DEV_CLIENT_ID
}
