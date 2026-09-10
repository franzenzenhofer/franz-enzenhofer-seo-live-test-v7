import { createRobotsRestrictionRule } from './createRobotsRestrictionRule'

export const robotsNoImageIndexRule = createRobotsRestrictionRule({
  directive: 'noimageindex', name: 'Image indexing restrictions',
  meaning: 'noimageindex asks Google not to index images from this page. It does not block indexing of the page itself, and the same image may still be indexed when linked or embedded elsewhere.',
  action: 'If these images should be discoverable in image search, remove noimageindex from the applicable tags or X-Robots-Tag headers listed below. Keep it if image exclusion is intentional; do not remove unrelated robots instructions.',
})
