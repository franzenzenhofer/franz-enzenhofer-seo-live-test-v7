import { createRobotsNumberRule } from './createRobotsNumberRule'

export const robotsMaxVideoPreviewRule = createRobotsNumberRule({
  directive: 'max-video-preview', name: 'Video preview duration limits', unit: 'seconds',
  zeroMeaning: 'At most a static image is permitted; no video preview.',
  defaultMeaning: 'Without this instruction, Google chooses the video preview length. -1 allows any duration and 0 permits only a static image. Other applicable robots restrictions can still prevent previews.',
})
