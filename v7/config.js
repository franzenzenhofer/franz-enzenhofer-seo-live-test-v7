/**
 * SINGLE SOURCE OF TRUTH for extension configuration
 *
 * This file is the ONLY place where OAuth client IDs and other
 * critical configuration values are defined.
 *
 * All other files MUST import from this file.
 */

// Using the EXACT SAME client ID as old PUBLISHED extension!
export const OAUTH_CLIENT_ID = '335346275770-6d6s9ja0h7brn24ghf3vqa9kv7ko5vfv.apps.googleusercontent.com'

// ONLY non-sensitive scopes may be listed here.
//
// Google shows the "Google hasn't verified this app" interstitial to every user whose
// OAuth request contains an unapproved SENSITIVE scope, and puts a lifetime 100-user cap
// on the Cloud project. `webmasters.readonly` is classified non-sensitive, so Search
// Console works with no verification at all.
//
// `analytics.readonly` was requested here from 2016 until 2026-09-08 although the code
// never made a single Google Analytics API call. That one dead scope was the sole cause
// of the interstitial. Do not add a sensitive scope back without shipping verification
// first - see tickets/oauth-unverified-app-gsc.md.
export const OAUTH_SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly']

export const EXTENSION_NAME = 'Franz Enzenhofer SEO Live Test'
export const EXTENSION_NAME_DEV = 'Franz Enzenhofer SEO Live Test (Dev)'

// Using OLD extension's public key so NEW extension gets SAME extension ID!
export const DEV_EXTENSION_KEY = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsWxGAo8gbhOgcRRk5BK+T2GTm+BwZEoLpCbf+1cCDVe0SgM7z69xW8o82TgqPtMO5GIqz0039fcWp88bCcLQHyhv/l9pf8+zp28PRp34Rhc1RwDp/EcSAf2D/QfAqTCImOH5Z9yEbuWRwkVEuJuKdYtYK/QqTd/iqmvlfXJ1Smhsb0Ulqdk2PlAOS0l8N8/03JJNto7mQ70HO3bqU0A1bL96Peo70wlBLL1OPWh9XxnOlw4MVet9nL3SevCjp9iZUFMgncYlm6oMnUSRnVbuhCwVqw1AF1QB8uOv814NU4SIu++YdUtzzb3ATK6eXAoZ/cPCrYG/J7cZLcKObxyWNwIDAQAB'

// This key generates extension ID: jbnaibigcohjfefpfocphcjeliohhold (SAME as old extension!)
