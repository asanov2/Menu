// ── Menu domain ───────────────────────────────────────────────────────────────

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

export interface Menu {
  id: string;
  name: string;
  slug: string;
  language: 'ru' | 'kz' | 'en';
  is_default: boolean;
  items_count: number;
}

export interface Category {
  id: string;
  name: string;
  sort_order: number;
  is_visible: boolean;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  preparation_time: number | null;
  tags: string[];
  sort_order: number;
  category_id: string;
}

// ── API responses ─────────────────────────────────────────────────────────────

export interface MenuPageResponse {
  restaurant: Restaurant;
  menu: Menu;
  categories: Category[];
}

// ── Auth domain ───────────────────────────────────────────────────────────────

export interface RestaurantAuth {
  id: string;
  name: string;
  slug: string;
  plan: 'starter' | 'business' | 'pro';
  is_active: boolean;
  email: string;
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface TopItem {
  item_id: string;
  views: number;
  rank: number;
}

export interface OverviewStats {
  period_days: number;
  total_menu_views: number;
  total_item_views: number;
  device_breakdown: { mobile: number; desktop: number };
  top_items: TopItem[];
  most_common_peak_hour: number | null;
}

// ── Billing ───────────────────────────────────────────────────────────────────

export interface Subscription {
  id: string;
  plan: 'starter' | 'business' | 'pro';
  status: 'active' | 'trial' | 'expired' | 'cancelled';
  current_period_end: string;
  trial_ends_at: string | null;
  auto_renew: boolean;
}
