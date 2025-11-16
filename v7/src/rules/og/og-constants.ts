/**
 * Open Graph meta tag selectors
 * Used across OG rules to eliminate selector string duplication
 */

export const OG_SELECTORS = {
  TITLE: 'meta[property="og:title"]',
  DESCRIPTION: 'meta[property="og:description"], meta[name="og:description"]',
  URL: 'meta[property="og:url"], meta[name="og:url"]',
  IMAGE: 'meta[property="og:image"], meta[name="og:image"]',
} as const

export const OG_IMAGE_MIN_WIDTH = 1200
export const OG_IMAGE_MIN_HEIGHT = 630
