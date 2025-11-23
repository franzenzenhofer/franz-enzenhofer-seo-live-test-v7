import { defineManifest } from '@crxjs/vite-plugin'

import pkg from '../package.json'
import { EXTENSION_NAME, EXTENSION_NAME_DEV, DEV_EXTENSION_KEY, OAUTH_SCOPES } from '../config.js'

import { detectLegacyClientId } from './manifest-env'
import { COMMANDS, HOST_PERMISSIONS, PANEL_PATH, PERMISSIONS, WEB_ACCESSIBLE } from './manifest.parts'

const clientId = detectLegacyClientId()
const isDev = process.env['EXT_ENV'] === 'dev'
const name = isDev ? EXTENSION_NAME_DEV : EXTENSION_NAME
const version = pkg.version
const version_name = isDev ? `${version}-dev` : version

export default defineManifest({
  manifest_version: 3,
  name,
  version,
  version_name,
  description: 'Modern MV3 side-panel extension for live tests.',
  action: { default_title: 'Open Live Test' },
  icons: {
    '16': 'src/icons/icon-16.png',
    '32': 'src/icons/icon-32.png',
    '48': 'src/icons/icon-48.png',
    '128': 'src/icons/icon-128.png',
  },
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
          scopes: OAUTH_SCOPES,
        },
      }
    : {}),
  // ALWAYS include key to ensure consistent extension ID (same as old extension)
  key: DEV_EXTENSION_KEY,
})
