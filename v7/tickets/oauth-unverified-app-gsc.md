# "Google hasn't verified this app (ownedbymo@gmail.com)" when connecting Search Console

Reported 2026-09-08 by Christoph A. Müller (christoph.m@coffeecircle.com), reply to the
2026-09-08 newsletter. Screenshot: the standard Google "unverified app" interstitial,
naming `ownedbymo@gmail.com` as the developer.

## What happens
Any user who clicks **Settings → Google Account → Sign In** to connect Google Search Console
gets Google's red-triangle interstitial:

> Google hasn't verified this app
> The app is requesting access to sensitive info in your Google Account. Until the developer
> (ownedbymo@gmail.com) verifies this app with Google, you shouldn't use it.

The sign-in still works via **Advanced → Go to … (unsafe)**, but almost nobody clicks that,
and the named developer is a stranger to the user - it looks like a phishing attempt.

## Root cause (7 whys, each with evidence)

1. **Why the warning?**
   Google shows the "unverified app" screen for every OAuth client that requests *sensitive*
   scopes and has not passed OAuth verification.
   Evidence: `v7/config.js:13-16` requests `webmasters.readonly` + `analytics.readonly`, both
   sensitive. https://support.google.com/cloud/answer/7454865

2. **Why is this OAuth client unverified?**
   Its Google Cloud project (number `335346275770`) never went through sensitive-scope
   verification - no branding, no verified domain, no demo video, no submission.
   Requirements: https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification

3. **Why was verification never submitted?**
   The project does not belong to Franz. The consent screen's user-support email is
   `ownedbymo@gmail.com` = Moritz Kobrna, the contract developer who built the original
   extension 2016-2019 (Gmail: "Update Chrome Extension" 2017-03-20, "Rechnung Chrome
   Extension" 2019-04-17, "obtrusice live test - update und erweiterung" 2018-11-06).
   He created the Cloud project under his personal Gmail account. Whether Franz still has an
   IAM role on that project is UNVERIFIED - Google Cloud Console and gcloud both demand a
   Workspace reauthentication (password) that could not be completed in this session. That is
   the first thing to check: https://console.cloud.google.com/auth/branding?project=335346275770

4. **Why is v7 - a 2026 rewrite - still using a 2016 third-party OAuth client?**
   It was copied on purpose. `v7/config.js:10` says "Using the EXACT SAME client ID as old
   PUBLISHED extension!"; the same ID sits in the old repo (`f19n-obtrusive-livetest/Gruntfile.js:73`)
   and in the shipped build (`latest-build.zip → manifest.json`, v0.1.800).

5. **Why was it copied without questioning ownership?**
   Keeping the client ID (and the extension key → same extension ID
   `jbnaibigcohjfefpfocphcjeliohhold`) was the cheapest way to keep OAuth working during the
   rewrite, and it was then frozen as doctrine: `v7/README.md:109` "DO NOT change
   OAUTH_CLIENT_ID … unless you want to break OAuth", `v7/CLAUDE.md:12` "Critical values (DO
   NOT CHANGE)". The question "whose Google Cloud project is this?" was never asked.

6. **Why did nobody notice in ten years of testing?**
   Google only shows the consent screen - and therefore the interstitial - when the account
   has no existing grant for that client. Franz and every long-term user granted access years
   ago, so they never see it. Only *new* users do. Every OAuth test in the repo tests our own
   config, not Google's opinion of it.

7. **Why did CI not catch it?**
   `v7/scripts/verify-build-config.ts` and `v7/tests/oauth-config.test.ts` assert that the
   client ID equals the hard-coded legacy value. They lock the defect in: they can only fail
   if someone *fixes* the client ID. Nothing checks project ownership or verification status,
   and nothing can - that state lives in a Cloud Console we have no access to.

**Root cause:** the product's OAuth identity is not owned by us. It is a legacy, unverified
OAuth client inside a former contractor's personal Google Cloud project, and the repo froze
that as an invariant instead of treating it as debt.

## Severity beyond the warning
The 100-new-user cap on unverified apps "applies over the entire lifetime of the project and
it cannot be reset or changed" (https://support.google.com/cloud/answer/13463817). This
project has been serving the extension since ~2016. When the cap is reached, new users stop
getting the warning and start getting a hard block. Verification removes both the warning and
the cap.

## Fix

### Path A - preferred, NO new extension version
The client ID stays `335346275770-6d6s9ja0h7brn24ghf3vqa9kv7ko5vfv`, so nothing in the
manifest or the store listing changes.

1. Check first whether Franz already has access:
   https://console.cloud.google.com/auth/branding?project=335346275770
   If yes, skip to step 2. If not, ask Moritz Kobrna (ownedbymo@gmail.com) to add
   `franz.enzenhofer@fullstackoptimization.com` as **Owner** on Cloud project
   `335346275770`, then remove himself. Only he can do that - it is his account.
2. Google Cloud Console → **Google Auth Platform → Branding** for that project:
   - App name: `Franz Enzenhofer SEO Live Test`
   - User support email + developer contact: Franz's address (removes `ownedbymo@gmail.com`
     from the warning immediately)
   - App logo: the 128px extension icon
   - App home page: https://seo-live-test.franzai.com/ (HTTP 200, verified 2026-09-08)
   - Privacy policy: https://seo-live-test.franzai.com/privacy (HTTP 200; note `privacy.html`
     301s to `/privacy` - link the final URL)
   - Authorized domain: `franzai.com`, verified in Search Console by the project owner
3. **Audience → Publish app** (In production, not Testing).
4. **Verification Center → Submit for verification** for the two sensitive scopes, with an
   unlisted YouTube demo video that shows the OAuth grant, the app name and the client ID in
   the address bar, plus real usage of both scopes.
5. Warning and user cap disappear when Google approves (weeks, not days).

### Path B - fallback if Moritz cannot or will not hand the project over
Requires one new store release.

1. Create a **Chrome Extension** OAuth client for extension ID
   `jbnaibigcohjfefpfocphcjeliohhold` in Franz's own project
   `seo-extension-1763158338633`, branding as above, publish, submit for verification.
2. Change `OAUTH_CLIENT_ID` in `v7/config.js` plus the two places that pin the old value
   (`v7/scripts/verify-build-config.ts:12`, `v7/tests/oauth-config.test.ts`), rebuild, ship.
3. Existing users must re-authorize once.
4. Fresh project = fresh 100-user cap while verification is pending, and the identity is ours.

Path B is also the right move if Path A ever stalls: as long as the OAuth identity lives in
someone else's account, one account deletion kills Search Console for every user.

## Interim, today, no release
Tell affected users to click **Advanced → Go to Franz Enzenhofer SEO Live Test (unsafe)**.
The extension only ever requests read-only Search Console and Analytics scopes; the token is
kept in `chrome.storage.session` (`v7/src/shared/tokenStorage.ts`) and is never sent anywhere
but Google.

## Follow-ups
- Once the OAuth app is ours, replace the "DO NOT CHANGE" doctrine in README/CLAUDE.md with
  "this client belongs to project X owned by Y" (done in this commit).
- Consider a pre-flight note in the Sign In UI while verification is pending.
