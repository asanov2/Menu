export interface AllergenInfo {
  code: string;
  name_ru: string;
  name_kz: string;
  name_en: string;
  icon: string;
}

export const ALLERGENS: AllergenInfo[] = [
  { code: 'gluten',    name_ru: 'Глютен',       name_kz: 'Глютен',          name_en: 'Gluten',    icon: 'wheat' },
  { code: 'milk',      name_ru: 'Молоко',        name_kz: 'Сүт',             name_en: 'Milk',      icon: 'droplet' },
  { code: 'eggs',      name_ru: 'Яйца',          name_kz: 'Жұмыртқа',        name_en: 'Eggs',      icon: 'egg' },
  { code: 'nuts',      name_ru: 'Орехи',         name_kz: 'Жаңғақ',          name_en: 'Nuts',      icon: 'leaf' },
  { code: 'peanuts',   name_ru: 'Арахис',        name_kz: 'Арахис',          name_en: 'Peanuts',   icon: 'plant-2' },
  { code: 'soy',       name_ru: 'Соя',           name_kz: 'Соя',             name_en: 'Soy',       icon: 'plant' },
  { code: 'fish',      name_ru: 'Рыба',          name_kz: 'Балық',           name_en: 'Fish',      icon: 'fish' },
  { code: 'seafood',   name_ru: 'Морепродукты',  name_kz: 'Теңіз өнімдері',  name_en: 'Seafood',   icon: 'ripple' },
  { code: 'celery',    name_ru: 'Сельдерей',     name_kz: 'Сельдерей',       name_en: 'Celery',    icon: 'plant' },
  { code: 'mustard',   name_ru: 'Горчица',       name_kz: 'Қыша',            name_en: 'Mustard',   icon: 'droplet-half-2' },
  { code: 'sesame',    name_ru: 'Кунжут',        name_kz: 'Кунжут',          name_en: 'Sesame',    icon: 'circle-dots' },
  { code: 'sulphites', name_ru: 'Сульфиты',      name_kz: 'Сульфиттер',      name_en: 'Sulphites', icon: 'flask' },
  { code: 'lupin',     name_ru: 'Люпин',         name_kz: 'Люпин',           name_en: 'Lupin',     icon: 'flower' },
  { code: 'molluscs',  name_ru: 'Моллюски',      name_kz: 'Моллюскалар',     name_en: 'Molluscs',  icon: 'ripple' },
];

export const ALLERGEN_MAP: Record<string, AllergenInfo> = Object.fromEntries(
  ALLERGENS.map((a) => [a.code, a]),
);
