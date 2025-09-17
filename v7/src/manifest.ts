import { defineManifest } from '@crxjs/vite-plugin'

import pkg from '../package.json'

import { detectLegacyClientId } from './manifest-env'
import { COMMANDS, HOST_PERMISSIONS, PANEL_PATH, PERMISSIONS } from './manifest.parts'

const clientId = detectLegacyClientId()
const isDev = process.env['EXT_ENV'] === 'dev'
const name = isDev ? 'F19N Obtrusive Live Test v7 (Dev)' : 'F19N Obtrusive Live Test v7'
const version = pkg.version
const version_name = isDev ? `${version}-dev` : version

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
  web_accessible_resources: [
    { resources: ['src/offscreen.html'], matches: ['<all_urls>'] },
  ],
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
})
