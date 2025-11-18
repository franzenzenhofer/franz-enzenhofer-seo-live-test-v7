# Configuration - Single Source of Truth

## ⚠️ IMPORTANT: Do NOT edit configuration in multiple places!

All extension configuration is centralized in **ONE file**:

```
v7/config.js  ← SINGLE SOURCE OF TRUTH
```

## What's in config.js

- **OAUTH_CLIENT_ID** - Google OAuth 2.0 client ID (from old working extension)
- **OAUTH_SCOPES** - Google API scopes (Search Console, Analytics)
- **EXTENSION_NAME** - Production extension name
- **EXTENSION_NAME_DEV** - Development extension name
- **DEV_EXTENSION_KEY** - Public key for stable dev extension ID

## Files that use config.js

1. `src/manifest.ts` - Builds manifest.json with OAuth config
2. `src/manifest-env.ts` - Detects OAuth client ID
3. `src/shared/auth.ts` - OAuth scopes for sign-in
4. `scripts/set-oauth-env.mjs` - Exports client ID for build scripts
5. `package.json` - Build scripts use `$(node scripts/set-oauth-env.mjs)`

## How to change OAuth client ID

**Only edit ONE file:**

```bash
vim v7/config.js  # Change OAUTH_CLIENT_ID here
npm run fastbuild # Rebuild - automatically uses new ID
```

**DO NOT edit:**
- ❌ `package.json` build scripts (auto-generated from config.js)
- ❌ `src/manifest.ts` (imports from config.js)
- ❌ `src/shared/auth.ts` (imports from config.js)
- ❌ Anywhere else!

## TypeScript support

TypeScript declarations are in:
```
v7/config.d.ts  ← Type definitions for config.js
```

These are auto-generated and should match config.js exports.

## Extension IDs

The `DEV_EXTENSION_KEY` in config.js generates a stable extension ID:
```
enkjceaniaomnogacnigmlpofdcegcfc
```

This allows:
1. Consistent extension ID across dev builds
2. OAuth configuration to whitelist specific extension ID
3. No need to reconfigure OAuth after rebuilds

## Verification

After changing config.js, verify:

```bash
npm run fastbuild
cat dist/manifest.json | jq '.oauth2'
```

Should output:
```json
{
  "client_id": "335346275770-6d6s9ja0h7brn24ghf3vqa9kv7ko5vfv.apps.googleusercontent.com",
  "scopes": [
    "https://www.googleapis.com/auth/webmasters.readonly",
    "https://www.googleapis.com/auth/analytics.readonly"
  ]
}
```

✅ If this matches, configuration is correct!
❌ If different, check config.js and rebuild.
