import type { Rule } from '@/core/types'
import { pageEffectiveRobots } from '@/shared/effectiveRobots'
import { robotsEvidence } from '@/shared/robotsEvidence'

const NAME = 'Google indexing permission'
export const discoverIndexableRule: Rule = {
  id: 'discover:indexable', name: NAME, enabled: true, what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag',
      'https://developers.google.com/search/docs/appearance/google-discover',
    ],
    description: 'Checks the effective noindex restriction for Googlebot across applicable robots meta tags and X-Robots-Tag headers.',
    userGuide: {
      check: 'Checks whether your code tells Google to exclude this page from search. A pass here means no noindex restriction was found; it does not prove Google has indexed the page or selected it for Discover.',
      action: 'If this page should appear in Google, remove noindex (or none) from every blocking tag and header listed below. Check the page visibility setting in your CMS or SEO plugin. Keep the restriction if exclusion is intentional.',
    },
  },
  async run(page) {
    const effective = pageEffectiveRobots(page)
    const blocking = effective.directives.filter((entry) => entry.hasNoindex)
    return {
      label: 'DISCOVER', name: NAME,
      message: effective.noindex ? 'Googlebot is instructed not to index this page.' : 'No noindex restriction found for Googlebot.',
      type: effective.noindex ? 'warn' : 'ok', priority: effective.noindex ? 150 : 850,
      details: {
        value: effective.noindex ? blocking.map((entry) => `${entry.source === 'meta' ? 'Meta tag' : 'X-Robots-Tag'}: ${entry.value}`).join('; ') : 'Search indexing is allowed by the inspected robots instructions.',
        interpretation: effective.noindex
          ? 'noindex means “do not show this page in search results.” The instruction none includes noindex. An index instruction elsewhere does not cancel a noindex restriction.'
          : 'This checks permission, not actual index status. Google may still exclude the page for other reasons.',
        ...(blocking.length ? { blockingInstructions: robotsEvidence(blocking) } : {}),
      },
    }
  },
}
