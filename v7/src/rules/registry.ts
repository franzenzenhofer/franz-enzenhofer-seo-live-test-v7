import { titleRule } from './head/title'
import { metaDescriptionRule } from './head/metaDescription'
import { canonicalRule } from './head/canonical'
import { httpStatusRule } from './http/status'
import { robotsTxtRule } from './robots/robotsTxt'
import { robotsMetaRule } from './head/robotsMeta'
import { hreflangRule } from './head/hreflang'
import { ogTitleRule } from './og/title'

import type { Rule } from '@/core/types'

export const registry: Rule[] = [
  titleRule,
  metaDescriptionRule,
  canonicalRule,
  httpStatusRule,
  robotsTxtRule,
  robotsMetaRule,
  hreflangRule,
  ogTitleRule,
]
