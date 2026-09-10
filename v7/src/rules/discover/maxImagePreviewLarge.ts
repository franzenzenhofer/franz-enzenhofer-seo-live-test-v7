import type { Rule } from '@/core/types'
import { pageEffectiveRobots } from '@/shared/effectiveRobots'
import { robotsEvidence } from '@/shared/robotsEvidence'
import { findRobotsTokens } from '@/shared/robots-tokens'

const NAME = 'Large image preview permission'
export const discoverMaxImagePreviewLargeRule: Rule = {
  id: 'discover:max-image-preview-large', name: NAME, enabled: true, what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/appearance/google-discover',
      'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag',
    ],
    description: 'Explains Googlebot image-preview restrictions and whether robots instructions permit large previews.',
    userGuide: {
      check: 'Checks image-preview permission in applicable robots tags and HTTP headers. Large previews are recommended for Discover; this does not check image quality, validate AMP, or guarantee Discover placement.',
      action: 'If you want large previews, set max-image-preview:large in the robots meta tag or X-Robots-Tag header. Change any conflicting none or standard limits listed below, and remove noimageindex if image exclusion is unintended. Preserve unrelated instructions.',
    },
  },
  async run(page) {
    const effective = pageEffectiveRobots(page)
    const ok = effective.maxImagePreview === 'large' && !effective.noimageindex
    const relevant = effective.directives.filter((directive) =>
      ['max-image-preview', 'noimageindex'].some((name) => findRobotsTokens([directive], name).length > 0))
    const value = effective.noimageindex ? 'noimageindex tells Google not to index images from this page.'
      : effective.maxImagePreview ? `Effective setting: max-image-preview:${effective.maxImagePreview}`
        : 'No valid max-image-preview instruction was found for Googlebot.'
    return {
      label: 'DISCOVER', name: NAME, type: ok ? 'ok' : 'warn', priority: ok ? 800 : 400,
      message: ok ? 'Your robots instructions allow large image previews.'
        : effective.noimageindex ? 'Image indexing is restricted by noimageindex.'
          : effective.maxImagePreview ? `Image previews are limited to ${effective.maxImagePreview === 'none' ? 'no preview' : 'standard size'}.`
            : 'Large image preview permission is not explicitly enabled.',
      details: {
        value,
        interpretation: 'When applicable robots instructions disagree, Google uses the more restrictive setting. A static image may still be allowed with nosnippet; noindex is checked separately. AMP is another way to enable large previews.',
        ...(relevant.length ? { previewInstructions: robotsEvidence(relevant) } : {}),
      },
    }
  },
}
