export const PLAN = {
  STARTER:  'starter',
  BUSINESS: 'business',
  PRO:      'pro',
} as const;
export type Plan = typeof PLAN[keyof typeof PLAN];

export const PLAN_STATUS = {
  ACTIVE:    'active',
  TRIAL:     'trial',
  EXPIRED:   'expired',
  CANCELLED: 'cancelled',
} as const;
export type PlanStatus = typeof PLAN_STATUS[keyof typeof PLAN_STATUS];

export const TRIAL_DAYS = 14;
export const ANALYTICS_DAYS: Record<Plan, number> = {
  starter:  7,
  business: 30,
  pro:      90,
};
export const TOP_ITEMS_LIMIT = 10;
