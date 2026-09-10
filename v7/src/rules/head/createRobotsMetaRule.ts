import type { Rule } from '@/core/types'
import { parseRobotsDirectives } from '@/shared/robots'
import { robotsEvidence } from '@/shared/robotsEvidence'

type Config = { id: string; name: string; crawler: 'robots' | 'googlebot'; noindexOnly?: boolean }
export const createRobotsMetaRule = (config: Config): Rule => ({
  id: config.id, name: config.name, enabled: true, what: 'static',
  meta: {
    provenance: 'google', references: ['https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag'],
    description: 'Reports named robots meta instructions throughout the document, with exact source tags and the meaning of noindex and nofollow.',
    userGuide: {
      check: `Checks all ${config.crawler} meta tags in the captured document, including body tags. Multiple tags combine; a permissive tag does not cancel a restriction. HTTP headers and other crawler-specific tags are checked separately.`,
      action: 'If this page should appear in search, remove the unintended noindex or none instruction from the listed template or CMS setting. Preserve intentional exclusions. Review nofollow separately: it concerns links, not whether this page can be indexed.',
    },
  },
  async run(page) {
    const directives = parseRobotsDirectives(page.doc).filter(d => d.source === 'meta' && d.ua === config.crawler)
    const hasNoindex = directives.some(d => d.hasNoindex)
    const hasNofollow = directives.some(d => d.hasNofollow)
    const restricted = hasNoindex || (!config.noindexOnly && hasNofollow)
    const message = !directives.length ? `No ${config.crawler === 'robots' ? 'robots' : 'Googlebot'} meta tag found.`
      : hasNoindex ? 'noindex blocks this page from indexing when the crawler can read the instruction.'
        : hasNofollow ? "nofollow tells crawlers not to follow this page's links; it does not block page indexing."
          : `${directives.length} ${config.crawler} meta tag(s) found; no noindex or nofollow restriction in these tags.`
    return {
      label: 'HEAD', name: config.name, type: restricted ? 'warn' : 'info', priority: restricted ? 150 : 700, message,
      details: {
        count: directives.length, hasNoindex, hasNofollow,
        meaning: 'noindex excludes this page from search indexing; nofollow concerns following links. none applies both restrictions. An intentional restriction needs no change.',
        ...(directives.length ? { declaredInstructions: robotsEvidence(directives) } : {}),
      },
    }
  },
})
