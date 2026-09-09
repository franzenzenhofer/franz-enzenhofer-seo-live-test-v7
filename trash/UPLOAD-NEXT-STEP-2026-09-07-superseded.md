# Next step: get 7.0.105 into the Chrome Web Store

Everything is done except the upload. The upload is blocked because the Chrome Web Store
dashboard demands a password re-auth for both `franz.enzenhofer@fullstackoptimization.com`
and `team@fullstackoptimization.com`, and I am not allowed to type passwords.

## Fastest path (2 minutes, dashboard)

1. Open https://chrome.google.com/webstore/devconsole in the **team** Chrome profile
   (`Profile 1` = team@fullstackoptimization.com). 2FA code: `~/.local/bin/team-otp`.
2. Item **Franz Enzenhofer SEO Live Test** (`jbnaibigcohjfefpfocphcjeliohhold`) → Package →
   Upload new package → `v7/dist.zip` (already built, version **7.0.105**).
3. Submit for review, keep **"Publish automatically after review"** checked, rollout **100%**.

Nothing on the Store listing or Privacy tab needs changing: the update only REMOVES an OAuth
scope. No new permissions, so the review has no extra surface to look at.

There is no expedited review. Google's only fast path is `declarativeNetRequest`-rules-only
changes, which does not apply (https://developer.chrome.com/docs/webstore/skip-review).
Normal update review is "a few days"
(https://developer.chrome.com/docs/webstore/review-process#review-time).

## What is in the package

`v7/dist.zip`, version 7.0.105, `oauth2.scopes` = `["https://www.googleapis.com/auth/webmasters.readonly"]`
only. Client ID unchanged (`335346275770-6d6s…`), so the extension ID stays the same and no
existing user has to re-authorize.

## Why this fixes it

Live A/B, same OAuth client, same project, same external Google account, back to back:

| Requested scopes | Google's response |
| --- | --- |
| `webmasters.readonly` | normal consent screen |
| `webmasters.readonly` + `analytics.readonly` | `accounts.google.com/signin/oauth/warning` = "Google hasn't verified this app" |

`analytics.readonly` was the only sensitive scope and the code never called the Analytics API.

Full background: `v7/tickets/oauth-unverified-app-gsc.md`.

## Optional, for future releases without any dashboard login

Chrome Web Store API (needs one "Allow" click from team@, then it is scriptable forever):
enable "Chrome Web Store API" in a Cloud project, create a **Web application** client with
redirect `https://developers.google.com/oauthplayground`, scope
`https://www.googleapis.com/auth/chromewebstore`, get a refresh token, then:

```bash
curl -H "Authorization: Bearer $TOKEN" -X POST -T v7/dist.zip \
  "https://chromewebstore.googleapis.com/upload/v2/publishers/d06aab50-8d15-47f5-9a09-a8c9a51d069a/items/jbnaibigcohjfefpfocphcjeliohhold:upload"
curl -H "Authorization: Bearer $TOKEN" -X POST \
  "https://chromewebstore.googleapis.com/v2/publishers/d06aab50-8d15-47f5-9a09-a8c9a51d069a/items/jbnaibigcohjfefpfocphcjeliohhold:publish"
```

Set the consent screen User type to **Internal** so the refresh token does not expire after
7 days (https://support.google.com/cloud/answer/15549945).
