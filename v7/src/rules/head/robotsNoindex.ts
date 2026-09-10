import { createRobotsMetaRule } from './createRobotsMetaRule'

export const robotsNoindexRule = createRobotsMetaRule({
  id: 'head:robots-noindex', name: 'Page exclusion in robots meta', crawler: 'robots', noindexOnly: true,
})
