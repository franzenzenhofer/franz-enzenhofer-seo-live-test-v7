import { useQuery } from '@tanstack/react-query'

import { getPageInfoFromActive } from '@/shared/chrome'
import type { PageInfoT } from '@/shared/schemas'

export const usePageInfo = () =>
  useQuery<PageInfoT>({
    queryKey: ['pageInfo'],
    queryFn: () => getPageInfoFromActive<PageInfoT>(),
    staleTime: 1_000,
  })
