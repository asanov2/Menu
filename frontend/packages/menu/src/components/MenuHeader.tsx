import { useTranslation } from 'react-i18next';
import type { Category } from '@qrmenu/ui';
import CategoryTabs from './CategoryTabs';
import ViewToggle, { ViewMode } from './ViewToggle';
import styles from './MenuHeader.module.css';

type Language = 'ru' | 'kz' | 'en';

interface MenuHeaderProps {
  restaurantName: string;
  tableNumber: string | null;
  lang: Language;
  onLangChange: (lang: Language) => void;
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (id: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onSearchToggle?: () => void;
  cartCount?: number;
  onCartOpen?: () => void;
  plan: 'starter' | 'business' | 'pro';
}

const LANGS: { code: Language; label: string }[] = [
  { code: 'ru', label: 'RU' },
  { code: 'kz', label: 'ҚАЗ' },
  { code: 'en', label: 'EN' },
];

export default function MenuHeader({
  restaurantName,
  tableNumber,
  lang,
  onLangChange,
  categories,
  activeCategory,
  onCategoryChange,
  viewMode,
  onViewModeChange,
  onSearchToggle,
  cartCount = 0,
  onCartOpen,
  plan,
}: MenuHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.header}>
      <div className={styles.topBar}>
        <div className={styles.nameBlock}>
          <div className={styles.restaurantName}>{restaurantName}</div>
          {tableNumber && (
            <div className={styles.tableNumber}>
              {t('header.table', { number: tableNumber })}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          {onCartOpen && (
            <button
              onClick={onCartOpen}
              className={styles.cartBtn}
              aria-label="Корзина"
            >
              <i className="ti ti-shopping-cart" style={{ fontSize: 18 }} />
              {cartCount > 0 && (
                <span className={styles.cartBadge}>{cartCount}</span>
              )}
            </button>
          )}

          {plan !== 'starter' && (
            <button
              onClick={onSearchToggle}
              className={styles.searchBtn}
              aria-label="Поиск"
            >
              <i className="ti ti-search" style={{ fontSize: 18 }} />
            </button>
          )}

          {plan !== 'starter' && (
            <div className={styles.langSwitcher}>
              {LANGS.map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => onLangChange(code)}
                  className={`${styles.langBtn} ${lang === code ? styles.langBtnActive : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <CategoryTabs
        categories={categories}
        activeId={activeCategory}
        onSelect={onCategoryChange}
      />

      <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
    </div>
  );
}
