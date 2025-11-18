#!/usr/bin/env node
/**
 * Export OAuth client ID from config.js as environment variable
 * This ensures package.json scripts use the SINGLE SOURCE OF TRUTH
 */
import { OAUTH_CLIENT_ID } from '../config.js'

console.log(OAUTH_CLIENT_ID)
