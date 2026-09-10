import { createRobotsMetaRule } from './createRobotsMetaRule'

export const googlebotMetaRule = createRobotsMetaRule({
  id: 'head:meta-googlebot', name: 'Googlebot meta instructions', crawler: 'googlebot',
})
