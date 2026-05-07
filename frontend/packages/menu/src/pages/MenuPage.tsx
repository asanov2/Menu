import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useMenu } from '../hooks/useMenu';
import { useSearch } from '../hooks/useSearch';
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
  const { query, setQuery, filteredItems } = useSearch(data?.categories ?? []);

  useEffect(() => {
    if (visibleCategories.length > 0 && !activeCategory) {
      setActiveCategory(visibleCategories[0].id);
    }
  }, [visibleCategories, activeCategory]);

  useEffect(() => {
    if (query.length > 0) setShowSearch(true);
    const onScroll = () => setShowSearch(window.scrollY > 80 || query.length > 0);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Error states
  if (error) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 403) return <MenuInactive />;
    return <MenuNotFound />;
  }

  // Loading
  if (isLoading) {
    return (
      <div>
        <div style={{ background: 'var(--sidebar-bg)', height: 62 }} />
        <div style={{ background: 'var(--ink-primary)', height: 44 }} />
        <div style={{ background: 'var(--ink-primary)', height: 38 }} />
        <SkeletonLoader viewMode={viewMode} />
      </div>
    );
  }

  if (!data) return null;

  const currentCategory = visibleCategories.find((c) => c.id === activeCategory);
  const displayItems = filteredItems ?? currentCategory?.items ?? [];

  const renderItems = () => {
    const props = { items: displayItems, onItemClick: setSelectedItem };
    switch (viewMode) {
      case 'card':    return <ItemGrid {...props} />;
      case 'gallery': return <ItemGallery {...props} />;
      default:        return <ItemList {...props} />;
    }
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 600,
        margin: '0 auto',
        minHeight: '100dvh',
        paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
        background: 'var(--cream-bg)',
        overflowX: 'hidden',
        position: 'relative',
      }}
    >
      {/* Sticky header + search */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30 }}>
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
        />

        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ overflow: 'hidden' }}
            >
              <SearchBar
                value={query}
                onChange={setQuery}
                foundCount={filteredItems ? filteredItems.length : null}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Items */}
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

      {/* Empty search */}
      {filteredItems !== null && filteredItems.length === 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '60px 20px',
            gap: 12,
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: 48 }}>🍽️</span>
          <div
            style={{
              fontSize: 18,
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              color: 'var(--ink-primary)',
            }}
          >
            Ничего не найдено
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-secondary)' }}>
            Попробуйте другой запрос
          </div>
        </div>
      )}

      <ItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />

      {table && slug && (
        <WaiterButton slug={slug} table={parseInt(table, 10)} />
      )}
    </div>
  );
}
