import { defineManifest } from '@crxjs/vite-plugin'

import pkg from '../package.json'

import { detectLegacyClientId } from './manifest-env'
import { COMMANDS, HOST_PERMISSIONS, PANEL_PATH, PERMISSIONS, WEB_ACCESSIBLE } from './manifest.parts'

const clientId = detectLegacyClientId()
const isDev = process.env['EXT_ENV'] === 'dev'
const name = isDev ? 'F19N Obtrusive Live Test v7 (Dev)' : 'F19N Obtrusive Live Test v7'
const version = pkg.version
const version_name = isDev ? `${version}-dev` : version
const DEV_TEST_KEY = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvU2J55ldTJRJsfzk9SCDJgvFacfjx2fjRn6VSDfk0NKC4lyq6wy5T/kTUQaiIhLteOKkIVbWKju8q9Q7GICCRqVMj7UTVbYgRVpWkLGReCXuqVZav46B1ADGuL7KpK7X3TLKsjGgZqWcsla3bdJK6qnFwPtmIJPnjoIh5EsYfEP6SjnZvHH4ZM8guh0s7aOoh06WV4WRzk+B7uq87Btko7ZyKdln3ka66/vqbAzEf3BeQR57OoMSgZKCEMkjfw9peL+15o6b9T5Y88GgRPQA6s4gIH8HN+okXMY5KSVZ1jyEd3gFrfL6lfp3gSGuXtdjtHlitvGmEqtza3B+u2zBAQIDAQAB'

export default defineManifest({
  manifest_version: 3,
  name,
  version,
  version_name,
  description: 'Modern MV3 side-panel extension for live tests.',
  action: { default_title: 'Open Live Test' },
  permissions: [...PERMISSIONS],
  host_permissions: [...HOST_PERMISSIONS],
  background: { service_worker: 'src/background/index.ts', type: 'module' },
  optional_host_permissions: [],
  optional_permissions: [],
  side_panel: { default_path: PANEL_PATH },
  commands: COMMANDS,
  content_scripts: [
    { matches: ['<all_urls>'], js: ['src/content/index.ts'], run_at: 'document_idle' },
  ],
  web_accessible_resources: WEB_ACCESSIBLE,
  ...(clientId
    ? {
        oauth2: {
          client_id: clientId,
          scopes: [
            'https://www.googleapis.com/auth/webmasters.readonly',
            'https://www.googleapis.com/auth/analytics.readonly',
          ],
        },
      }
    : {}),
  ...(isDev ? { key: DEV_TEST_KEY } : {}),
})
