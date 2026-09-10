import { createRobotsRestrictionRule } from './createRobotsRestrictionRule'

export const robotsNosnippetRule = createRobotsRestrictionRule({
  directive: 'nosnippet', name: 'Search snippet restrictions',
  meaning: 'nosnippet prevents a text snippet and video preview in Google results. max-snippet:0 also prevents text snippets. A static image can still appear, and these instructions do not themselves block page indexing.',
  action: 'If snippets should appear, remove nosnippet and change max-snippet:0 in every applicable tag or header listed below. Check the CMS preview controls or server configuration. Keep the restriction if it is intentional.',
})
