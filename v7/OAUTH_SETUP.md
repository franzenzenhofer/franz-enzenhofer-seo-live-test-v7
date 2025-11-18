# OAuth Setup for F19N Live Test Extension

## Problem
The extension sign-in fails because the OAuth client ID is not configured with the correct Chrome extension ID.

## OAuth Client Details
- **Client ID**: `335346275770-6d6s9ja0h7brn24ghf3vqa9kv7ko5vfv.apps.googleusercontent.com`
- **Project ID**: `335346275770`

## Extension IDs
Your extension can have different IDs depending on how it's built:

1. **DEV build** (with key): `enkjceaniaomnogacnigmlpofdcegcfc`
2. **Production build** (no key): Random ID based on install location (e.g., `kdnajmbmaaaopnlippleebaookdicnac`)

## ✅ FIX: Configure OAuth Client

### Step 1: Open Google Cloud Console
```bash
open "https://console.cloud.google.com/apis/credentials/oauthclient/335346275770-6d6s9ja0h7brn24ghf3vqa9kv7ko5vfv.apps.googleusercontent.com?project=335346275770"
```

### Step 2: Add Authorized JavaScript Origins
Add BOTH extension IDs to handle dev and production builds:

```
chrome-extension://enkjceaniaomnogacnigmlpofdcegcfc
chrome-extension://kdnajmbmaaaopnlippleebaookdicnac
```

### Step 3: Verify Scopes
Ensure these scopes are enabled:
- `https://www.googleapis.com/auth/webmasters.readonly`
- `https://www.googleapis.com/auth/analytics.readonly`

### Step 4: Test
1. Reload the extension in `chrome://extensions`
2. Open the extension settings
3. Click "Sign In"
4. Should now show Google OAuth consent screen

## Quick Commands

### Build DEV version (stable extension ID):
```bash
cd /Users/franzenzenhofer/dev/franz-enzenhofer-seo-live-test-v7/v7
EXT_ENV=dev npm run fastbuild
```

### Load extension:
```bash
open -a "Google Chrome" "chrome://extensions"
# Then click "Load unpacked" and select:
# /Users/franzenzenhofer/dev/franz-enzenhofer-seo-live-test-v7/v7/dist
```

### Get current extension ID:
1. Open `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Find "F19N Obtrusive Live Test v7 (Dev)"
4. Extension ID shown below the name

## Alternative: Use the OLD working extension ID

If you have an old version that WORKS, tell me the extension ID and I'll:
1. Extract the public key from that extension
2. Add it to manifest.ts
3. Rebuild so it uses the same ID

**To find old extension ID:**
```bash
# In Chrome, go to chrome://extensions
# Find the OLD working "Live Test" extension
# Copy the extension ID (32 characters)
```

Then run:
```bash
# Extract manifest from old extension
cp -r ~/Library/Application\ Support/Google/Chrome/Default/Extensions/OLD_EXTENSION_ID/VERSION/manifest.json /tmp/old_manifest.json
cat /tmp/old_manifest.json
```
