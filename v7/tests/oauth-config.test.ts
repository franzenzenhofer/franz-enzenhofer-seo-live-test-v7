import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('OAuth Configuration Verification', () => {
  it('dist/manifest.json has correct OAuth client ID', () => {
    const manifestPath = join(process.cwd(), 'dist', 'manifest.json')
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))

    expect(manifest.oauth2?.client_id).toBe(
      '335346275770-6d6s9ja0h7brn24ghf3vqa9kv7ko5vfv.apps.googleusercontent.com'
    )
  })

  it('dist/manifest.json has the public key that generates extension ID jbnaibigcohjfefpfocphcjeliohhold', () => {
    const manifestPath = join(process.cwd(), 'dist', 'manifest.json')
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))

    // This is the public key from the old published extension
    const expectedKeyStart = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsWxGAo'

    expect(manifest.key).toBeDefined()
    expect(manifest.key).toContain(expectedKeyStart)
  })

  it('config.js exports correct OAuth client ID', async () => {
    const { OAUTH_CLIENT_ID } = await import('../config.js')

    expect(OAUTH_CLIENT_ID).toBe(
      '335346275770-6d6s9ja0h7brn24ghf3vqa9kv7ko5vfv.apps.googleusercontent.com'
    )
  })

  it('requests only the non-sensitive Search Console scope', async () => {
    const { OAUTH_SCOPES } = await import('../config.js')

    // A sensitive scope triggers Google's "hasn't verified this app" interstitial for
    // every new user and caps the Cloud project at 100 users for its lifetime.
    expect(OAUTH_SCOPES).toEqual(['https://www.googleapis.com/auth/webmasters.readonly'])
  })

  it('dist/manifest.json requests no sensitive scope', () => {
    const manifestPath = join(process.cwd(), 'dist', 'manifest.json')
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))

    expect(manifest.oauth2?.scopes).toEqual([
      'https://www.googleapis.com/auth/webmasters.readonly',
    ])
  })

  it('config.js exports correct DEV_EXTENSION_KEY', async () => {
    const { DEV_EXTENSION_KEY } = await import('../config.js')

    const expectedKeyStart = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsWxGAo'

    expect(DEV_EXTENSION_KEY).toBeDefined()
    expect(DEV_EXTENSION_KEY).toContain(expectedKeyStart)
  })
})
