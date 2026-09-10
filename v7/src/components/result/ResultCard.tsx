import { LegacyResultCard } from './LegacyResultCard'
import type { ResultCardProps } from './LegacyResultCard'

import { PresentationCard } from '@/components/presentation/Card'

export const ResultCard = (props: ResultCardProps) => props.result.presentation
  ? <PresentationCard {...props} />
  : <LegacyResultCard {...props} />
