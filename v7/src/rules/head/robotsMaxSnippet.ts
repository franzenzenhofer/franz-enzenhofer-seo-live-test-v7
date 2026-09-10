import { createRobotsNumberRule } from './createRobotsNumberRule'

export const robotsMaxSnippetRule = createRobotsNumberRule({
  directive: 'max-snippet', name: 'Search snippet length limits', unit: 'characters',
  zeroMeaning: 'No text snippet is permitted by this instruction.',
  defaultMeaning: 'Without an explicit limit, Google chooses the snippet length. A nosnippet instruction or another applicable shorter limit can still restrict it. This setting controls previews; it does not improve rankings or guarantee a snippet.',
})
