# "Google hasn't verified this app (ownedbymo@gmail.com)" when connecting Search Console

Reported 2026-09-08 by Christoph A. Müller, reply to the 2026-09-08 newsletter. Screenshot:
Google's red-triangle "unverified app" interstitial, naming `ownedbymo@gmail.com` as the
developer.

## What happened
Every user who had not granted access before got the interstitial when clicking
**Settings → Google Account → Sign In**. Sign-in still worked via **Advanced → Go to … (unsafe)**,
but the named developer is a stranger to the user - it reads like phishing.

## Root cause (7 whys, each with evidence)

1. **Why the interstitial?**
   Google shows it when an OAuth request contains a *sensitive* scope that has not been
   approved for that project: "If your users are seeing the 'unverified app' screen, it is
   because your OAuth request includes additional scopes that haven't been approved."
   (https://support.google.com/cloud/answer/15549945) - and it is driven by the scopes the
   client REQUESTS, not by the project as such
   (https://support.google.com/cloud/answer/7454865).

2. **Which of our scopes is sensitive?**
   Only `analytics.readonly`. The Google Cloud console groups
   `https://www.googleapis.com/auth/webmasters.readonly` under **non-sensitive** scopes and
   `https://www.googleapis.com/auth/analytics.readonly` under **sensitive** scopes (verified
   2026-09-08 in the Data Access page of project seo-extension-1763158338633). Google
   publishes no static list; the console's own grouping is the authoritative signal
   (https://developers.google.com/identity/protocols/oauth2/scopes).

3. **Why did we request a sensitive Analytics scope?**
   We never used it. `grep -rni analytics src/` finds six hits, all of them Search Console
   URLs or a comment - **zero Google Analytics API calls**. The scope was inherited verbatim
   from the 2016 extension (`f19n-obtrusive-livetest/dist/manifest.json`).

4. **Why was it inherited?**
   v7 copied the whole OAuth block on purpose - `v7/config.js:10` "Using the EXACT SAME
   client ID as old PUBLISHED extension!" - to keep the extension ID and the existing user
   grants working through the rewrite.

5. **Why was the copy never questioned?**
   It was frozen as doctrine: `README.md` "DO NOT change OAUTH_CLIENT_ID", `CLAUDE.md`
   "Critical values (DO NOT CHANGE)". Nobody asked which of those scopes the code actually
   uses, or whose Cloud project the client lives in.

6. **Why did nobody notice for ten years?**
   Google shows the consent screen - and therefore the interstitial - only when the account
   has no existing grant. Franz and every long-term user granted years ago. Only *new* users
   ever saw it.

7. **Why did CI not catch it?**
   `scripts/verify-build-config.ts` asserted that both scopes were PRESENT, and
   `tests/oauth-config.test.ts` pinned the client ID. The checks could only fail if someone
   fixed the bug. Nothing ever asked "is any requested scope sensitive?"

**Root cause:** the extension requested a sensitive OAuth scope it never used, inherited
unexamined from the 2016 build and locked in by the build checks. The unusable Cloud project
(owned by a former contractor) is why it could not be fixed from the Google side - it is not
what caused the warning.

## Why it could not be fixed without a release
The requested scopes live in the shipped `manifest.json` and in the `getAuthToken` call, so
changing them needs a new build. Everything else was checked and ruled out:
- Removing the scope from the project's Data Access does not help: "Using an unregistered
  scope, even if previously verified, will result in the user seeing the unverified app
  warning screen" (https://support.google.com/cloud/answer/15549135).
- Test users still see a warning, plus a 7-day token expiry
  (https://support.google.com/cloud/answer/15549945).
- Internal-only would restrict the app to one Workspace org
  (https://support.google.com/cloud/answer/13464323).
- Only successful verification removes it for an unchanged client
  (https://support.google.com/cloud/answer/7454865) - and that project belongs to
  `ownedbymo@gmail.com` (Moritz Kobrna, contract developer 2016-2019). Franz has no IAM role
  on it: the console reports missing `clientauthconfig.clients.list`,
  `oauthconfig.verification.get`, `resourcemanager.projects.get` for project 335346275770.

## Fix shipped
One-line scope reduction, **client ID unchanged** (`335346275770-6d6s…`), so no existing user
has to re-authorize and the extension ID stays `jbnaibigcohjfefpfocphcjeliohhold`:
- `config.js`: `OAUTH_SCOPES` is now only `webmasters.readonly`.
- `scripts/verify-build-config.ts`: build now FAILS on any known sensitive scope.
- `tests/oauth-config.test.ts`: two new tests pin the scope list in config and in
  `dist/manifest.json`.
- `src/manifest.parts.ts`: corrected the `identity` permission comment.

Result: the app requests only a non-sensitive scope, so no verification is required
("If your app utilizes only non-sensitive scopes, it is not mandatory for your app to
complete the app verification process", https://support.google.com/cloud/answer/13463073),
no interstitial, and no 100-user cap (the cap applies only to "unapproved sensitive or
restricted scopes", https://support.google.com/cloud/answer/15549945).

## Proof (live A/B, 2026-09-08)

Run against a throwaway Web OAuth client in our own unverified, in-production project, from an
account OUTSIDE the Workspace org (`f.enzenhofer@gmail.com` - org members and project owners are
exempt from the interstitial, which is why the first attempts with
`franz.enzenhofer@` and `team@` both looked clean and proved nothing):

| Requested scopes | Where Google lands |
| --- | --- |
| `webmasters.readonly` | `accounts.google.com/signin/oauth/v3/consent` - clean consent, "View Search Console data for your verified sites", Cancel / Allow |
| `webmasters.readonly` + `analytics.readonly` | `accounts.google.com/signin/oauth/warning` - the "Google hasn't verified this app" interstitial |

Same client, same project, same account, back to back. The single variable is the analytics scope.
The throwaway probe client was deleted afterwards.

## Own OAuth app prepared as a hedge (not shipped)
The legacy client still sits in a stranger's project; if that project is ever deleted, Search
Console breaks for everyone. A replacement is ready in Franz's own project
`seo-extension-1763158338633`:
- Client (type Chrome Extension, Item ID `jbnaibigcohjfefpfocphcjeliohhold`):
  `570341170190-h3pqkcloq0qbmar2t8gqhg2g3m8odh4r.apps.googleusercontent.com`
- Consent screen "Franz Enzenhofer SEO Live Test", support + developer contact
  franz.enzenhofer@fullstackoptimization.com, home page https://seo-live-test.franzai.com/,
  privacy https://seo-live-test.franzai.com/privacy, authorized domain `franzai.com`
- Audience External, publishing status **In production**, scope list: `webmasters.readonly`
  only, **no logo** (a logo would force verification -
  https://support.google.com/cloud/answer/15549049)

Swapping `OAUTH_CLIENT_ID` to it is a one-line change. Cost: every existing user grants
consent once more. Do it when that is acceptable - it is not urgent, and it is the only way
to stop depending on the contractor's account.

## Follow-ups
- Enable the Search Console API in `seo-extension-1763158338633` before any client swap.
- Chrome Web Store release with the scope reduction (the store review is the only wait).
