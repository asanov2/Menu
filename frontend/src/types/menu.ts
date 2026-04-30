export type TagType = 'popular' | 'vegan' | 'spicy' | 'new' | 'chef';

export type ViewMode = 'list' | 'card' | 'gallery';

export type Language = 'ru' | 'kz' | 'en';

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  cuisineType: string;
  logo?: string;
  isActive: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image?: string;
  emoji?: string;
  tags: TagType[];
  isAvailable: boolean;
  preparationTime?: number;
  categoryId: string;
}

export interface Category {
  id: string;
  name: string;
  emoji?: string;
  items: MenuItem[];
}

export interface MenuData {
  restaurant: Restaurant;
  categories: Category[];
  currency: string;
}
