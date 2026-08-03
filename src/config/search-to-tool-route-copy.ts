import {
  getSearchToToolPhaseACopy,
  type SearchToToolPhaseACopy,
  type SearchToToolPhaseARouteId,
} from '@/config/search-to-tool-phase-a-locales'
import { getSearchToToolRouteOverride } from '@/config/search-to-tool-route-overrides'

export type { SearchToToolPhaseARouteId }

export function getSearchToToolRouteCopy(
  locale: string,
  routeId: SearchToToolPhaseARouteId,
): SearchToToolPhaseACopy {
  const base = getSearchToToolPhaseACopy(locale, routeId)
  const override = getSearchToToolRouteOverride(locale, routeId)
  return { ...base, ...override }
}
