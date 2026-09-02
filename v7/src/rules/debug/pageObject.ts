import type { Rule } from '@/core/types'

const LABEL = 'DEBUG'
const NAME = 'Page object snapshot'
const RULE_ID = 'debug:page-object'

export const pageObjectRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'franz',
    references: [],
    description: 'Info-only debug dump of the raw page object: URL, status, headers, resource list, cache flag.',
  },
  async run(page) {
    const summary = {
      url: page.url,
      status: page.status,
      headers: page.headers || {},
      resources: page.resources || [],
      resourceCount: (page.resources || []).length,
      fromCache: page.fromCache ?? null,
    }
    return {
      label: LABEL,
      name: NAME,
      message: 'Page snapshot captured (debug).',
      type: 'info',
      priority: 900,
      details: { summary },
    }
  },
}
