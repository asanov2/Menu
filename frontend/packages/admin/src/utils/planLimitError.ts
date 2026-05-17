export interface PlanLimitDetail {
  code: 'PLAN_LIMIT_REACHED'
  message: string
  upgrade_to: string
}

export const PLAN_NAMES: Record<string, string> = {
  starter: 'Старт',
  business: 'Бизнес',
  pro: 'Про',
}

export const PLAN_PRICES: Record<string, number> = {
  starter: 3900,
  business: 7900,
  pro: 14900,
}

function extractDetail(err: unknown): Record<string, unknown> | null {
  if (!err || typeof err !== 'object') return null
  const e = err as Record<string, unknown>
  const detail =
    e['detail'] ??
    (e['response'] as Record<string, unknown> | undefined)?.['data']
  if (!detail || typeof detail !== 'object') return null
  return detail as Record<string, unknown>
}

export function isPlanLimitError(err: unknown): boolean {
  return getPlanLimitDetail(err) !== null
}

export function getPlanLimitDetail(err: unknown): PlanLimitDetail | null {
  const detail = extractDetail(err)
  if (!detail) return null

  // Unified format (admin-service + analytics-service after fix)
  if (detail['code'] === 'PLAN_LIMIT_REACHED') {
    return {
      code: 'PLAN_LIMIT_REACHED',
      message: detail['message'] as string,
      upgrade_to: (detail['upgrade_to'] ?? detail['required_plan']) as string,
    }
  }

  // Legacy analytics format (before fix — required_plan without code)
  if (detail['required_plan'] && detail['message']) {
    return {
      code: 'PLAN_LIMIT_REACHED',
      message: detail['message'] as string,
      upgrade_to: detail['required_plan'] as string,
    }
  }

  return null
}
