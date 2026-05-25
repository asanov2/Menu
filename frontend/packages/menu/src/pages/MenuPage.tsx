import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useMenu } from '../hooks/useMenu';
import { useSearch } from '../hooks/useSearch';
import { trackItemView } from '../api/menu';
import type { MenuItem } from '@qrmenu/ui';
import MenuHeader from '../components/MenuHeader';
import SearchBar from '../components/SearchBar';
import ItemList from '../components/ItemList';
import ItemGrid from '../components/ItemGrid';
import ItemGallery from '../components/ItemGallery';
import ItemModal from '../components/ItemModal';
import WaiterButton from '../components/WaiterButton';
import SkeletonLoader from '../components/SkeletonLoader';
import ViewToggle, { ViewMode } from '../components/ViewToggle';
import MenuNotFound from './MenuNotFound';
import MenuInactive from './MenuInactive';
import styles from './MenuPage.module.css';

type Language = 'ru' | 'kz' | 'en';
const VIEW_PREF_KEY = 'menu_view_preference';

export default function MenuPage() {
  const { data, isLoading, error, slug, lang, setLang, table } = useMenu();
  const { i18n } = useTranslation();

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem(VIEW_PREF_KEY) as ViewMode) || 'list';
  });
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const visibleCategories = useMemo(
    () => (data?.categories ?? []).filter((c) => c.is_visible),
    [data?.categories],
  );
  const { query, setQuery, filteredItems, selectedAllergens, toggleAllergen, flaggedItemIds } = useSearch(data?.categories ?? []);

  useEffect(() => {
    if (visibleCategories.length > 0 && !activeCategory) {
      setActiveCategory(visibleCategories[0].id);
    }
  }, [visibleCategories, activeCategory]);

  useEffect(() => {
    if (query.length > 0) setShowSearch(true);
  }, [query]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_PREF_KEY, mode);
  };

  const handleLangChange = (newLang: Language) => {
    setLang(newLang);
    i18n.changeLanguage(newLang);
    localStorage.setItem('menu_lang', newLang);
  };

  const handleCategoryChange = (id: string) => {
    setActiveCategory(id);
    setQuery('');
    window.scrollTo({ top: 0 });
  };

  if (error) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 403) return <MenuInactive />;
    return <MenuNotFound />;
  }

  if (isLoading) {
    return (
      <div>
        <div className={styles.loadingHeaderBg} />
        <div className={styles.loadingTabsBg} />
        <div className={styles.loadingToggleBg} />
        <SkeletonLoader viewMode={viewMode} />
      </div>
    );
  }

  if (!data) return null;

  const currentCategory = visibleCategories.find((c) => c.id === activeCategory);
  const displayItems = filteredItems ?? currentCategory?.items ?? [];

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    if (slug) trackItemView(slug, item.id);
  };

  const renderItems = () => {
    const props = { items: displayItems, onItemClick: handleItemClick, flaggedItemIds };
    switch (viewMode) {
      case 'card':    return <ItemGrid {...props} />;
      case 'gallery': return <ItemGallery {...props} />;
      default:        return <ItemList {...props} />;
    }
  };

  return (
    <div className={styles.page}>
      <div data-sticky-header className={styles.stickyHeader}>
        <MenuHeader
          restaurantName={data.restaurant.name}
          tableNumber={table}
          lang={lang as Language}
          onLangChange={handleLangChange}
          categories={visibleCategories}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onSearchToggle={() => setShowSearch((prev) => !prev)}
        />

        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className={styles.searchOverflow}
            >
              <SearchBar
                value={query}
                onChange={setQuery}
                foundCount={filteredItems ? filteredItems.length : null}
                selectedAllergens={selectedAllergens}
                onAllergenToggle={toggleAllergen}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeCategory}-${viewMode}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {renderItems()}
        </motion.div>
      </AnimatePresence>

      {filteredItems !== null && filteredItems.length === 0 && (
        <div className={styles.emptySearch}>
          <i className="ti ti-tools-kitchen-2" style={{ fontSize: 40 }} />
          <div className={styles.emptyTitle}>Ничего не найдено</div>
          <div className={styles.emptyDesc}>Попробуйте другой запрос</div>
        </div>
      )}

      <ItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />

      {table && slug && (
        <WaiterButton slug={slug} table={parseInt(table, 10)} />
      )}

      {data.restaurant.plan !== 'pro' && (
        <div className={styles.poweredBy}>
          <a
            href="https://qrmenus.kz"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.poweredByLink}
          >
            Powered by qrmenus.kz
          </a>
        </div>
      )}
    </div>
  );
}
