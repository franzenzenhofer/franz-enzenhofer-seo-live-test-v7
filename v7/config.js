/**
 * SINGLE SOURCE OF TRUTH for extension configuration
 *
 * This file is the ONLY place where OAuth client IDs and other
 * critical configuration values are defined.
 *
 * All other files MUST import from this file.
 */

export const OAUTH_CLIENT_ID = '335346275770-6d6s9ja0h7brn24ghf3vqa9kv7ko5vfv.apps.googleusercontent.com'

export const OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/analytics.readonly',
]

export const EXTENSION_NAME = 'F19N Obtrusive Live Test v7'
export const EXTENSION_NAME_DEV = 'F19N Obtrusive Live Test v7 (Dev)'

// Extension public key for stable extension ID in dev mode
export const DEV_EXTENSION_KEY = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvU2J55ldTJRJsfzk9SCDJgvFacfjx2fjRn6VSDfk0NKC4lyq6wy5T/kTUQaiIhLteOKkIVbWKju8q9Q7GICCRqVMj7UTVbYgRVpWkLGReCXuqVZav46B1ADGuL7KpK7X3TLKsjGgZqWcsla3bdJK6qnFwPtmIJPnjoIh5EsYfEP6SjnZvHH4ZM8guh0s7aOoh06WV4WRzk+B7uq87Btko7ZyKdln3ka66/vqbAzEf3BeQR57OoMSgZKCEMkjfw9peL+15o6b9T5Y88GgRPQA6s4gIH8HN+okXMY5KSVZ1jyEd3gFrfL6lfp3gSGuXtdjtHlitvGmEqtza3B+u2zBAQIDAQAB'

// This key generates extension ID: enkjceaniaomnogacnigmlpofdcegcfc
