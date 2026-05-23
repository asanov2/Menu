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

export const PLAN_PRICES: Record<Plan, number> = {
  starter:  3900,
  business: 9900,
  pro:      24900,
};

export const ANALYTICS_DAYS: Record<Plan, number> = {
  starter:  7,
  business: 30,
  pro:      90,
};

export const PLAN_LIMITS: Record<Plan, { menus: number | null; items: number | null }> = {
  starter:  { menus: 1,    items: 50  },
  business: { menus: 5,    items: 200 },
  pro:      { menus: null, items: null },
};

export const TOP_ITEMS_LIMIT = 10;
