import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useMenu } from './hooks/useMenu';
import { useSearch } from './hooks/useSearch';
import { Language, MenuItem, ViewMode } from '../../types/menu';
import MenuHeader from './components/MenuHeader';
import SearchBar from './components/SearchBar';
import ItemList from './components/ItemList';
import ItemGrid from './components/ItemGrid';
import ItemGallery from './components/ItemGallery';
import ItemModal from './components/ItemModal';
import WaiterButton from './components/WaiterButton';
import SkeletonLoader from './components/SkeletonLoader';
import MenuNotFound from '../NotFound/MenuNotFound';
import MenuInactive from '../NotFound/MenuInactive';

const VIEW_PREF_KEY = 'menu_view_preference';

export default function MenuPage() {
  const { data, isLoading, error, slug, lang, setLang, table } = useMenu();
  const { i18n } = useTranslation();

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(VIEW_PREF_KEY);
    return (saved as ViewMode) || 'list';
  });

  const [activeCategory, setActiveCategory] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const categories = data?.categories ?? [];
  const { query, setQuery, filteredItems } = useSearch(categories);

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  useEffect(() => {
    const onScroll = () => {
      setShowSearch(window.scrollY > 80 || query.length > 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [query]);

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Error states
  if (error) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 404) return <MenuNotFound />;
    return <MenuNotFound />;
  }

  if (data && !data.restaurant.isActive) {
    return <MenuInactive restaurantName={data.restaurant.name} />;
  }

  // Loading state
  if (isLoading) {
    return (
      <div>
        <div
          style={{
            background: '#1A1208',
            height: 60,
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
          }}
        >
          <div
            style={{
              width: 140,
              height: 22,
              borderRadius: 4,
              background: 'rgba(255,255,255,0.15)',
            }}
          />
        </div>
        <div style={{ background: '#221A10', height: 44 }} />
        <div style={{ background: '#221A10', height: 38, borderBottom: '0.5px solid #2A2010' }} />
        <SkeletonLoader viewMode={viewMode} />
      </div>
    );
  }

  if (!data) return null;

  const currentCategory = categories.find((c) => c.id === activeCategory);
  const displayItems = filteredItems ?? currentCategory?.items ?? [];

  const renderItems = () => {
    const props = { items: displayItems, onItemClick: setSelectedItem };
    switch (viewMode) {
      case 'card':
        return <ItemGrid {...props} />;
      case 'gallery':
        return <ItemGallery {...props} />;
      default:
        return <ItemList {...props} />;
    }
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Sticky header block: header + optional search */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30 }}>
        <MenuHeader
          restaurantName={data.restaurant.name}
          cuisineType={data.restaurant.cuisineType}
          tableNumber={table}
          lang={lang as Language}
          onLangChange={handleLangChange}
          categories={categories}
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
              transition={{ duration: 0.2 }}
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

      {/* Empty search state */}
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
              fontSize: 16,
              fontFamily: 'Cormorant Garamond, serif',
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

      {/* Modal */}
      <ItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />

      {/* Waiter button */}
      {table && slug && (
        <WaiterButton slug={slug} table={parseInt(table, 10)} />
      )}
    </div>
  );
}
