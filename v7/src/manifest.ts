import { defineManifest } from '@crxjs/vite-plugin'

import { detectLegacyClientId } from './manifest-env'

const clientId = detectLegacyClientId()

export default defineManifest({
  manifest_version: 3,
  name: "F19N Obtrusive Live Test v7",
  version: "0.1.0",
  description: "Modern MV3 side-panel extension for live tests.",
  action: { default_title: "Open Live Test" },
  permissions: [
    "sidePanel",
    "storage",
    "tabs",
    "scripting",
    "activeTab",
    "webRequest",
    "webNavigation",
    "identity"
  ],
  host_permissions: ["<all_urls>"],
  background: { service_worker: "src/background/index.ts", type: "module" },
  optional_host_permissions: ["<all_urls>"],
  optional_permissions: ["webRequest", "webNavigation", "identity"],
  side_panel: { default_path: "src/sidepanel.html" },
  content_scripts: [
    { matches: ["<all_urls>"], js: ["src/content/index.ts"], run_at: "document_idle" },
  ],
  web_accessible_resources: [
    { resources: ["src/offscreen.html"], matches: ["<all_urls>"] },
  ],
  ...(clientId
    ? {
        oauth2: {
          client_id: clientId,
          scopes: [
            "https://www.googleapis.com/auth/webmasters.readonly",
            "https://www.googleapis.com/auth/analytics.readonly",
          ],
        },
      }
    : {}),
})
