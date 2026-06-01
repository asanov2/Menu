import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useMenu } from '../hooks/useMenu';
import { useSearch } from '../hooks/useSearch';
import { useCart } from '../hooks/useCart';
import { trackItemView, getOrderConfig, type OrderConfig } from '../api/menu';
import type { MenuItem } from '@qrmenu/ui';
import MenuHeader from '../components/MenuHeader';
import SearchBar from '../components/SearchBar';
import ItemList from '../components/ItemList';
import ItemGrid from '../components/ItemGrid';
import ItemGallery from '../components/ItemGallery';
import ItemModal from '../components/ItemModal';
import CartModal from '../components/CartModal';
import WaiterButton from '../components/WaiterButton';
import SkeletonLoader from '../components/SkeletonLoader';
import ViewToggle, { ViewMode } from '../components/ViewToggle';
import MenuNotFound from './MenuNotFound';
import MenuInactive from './MenuInactive';
import styles from './MenuPage.module.css';

type Language = 'ru' | 'kz' | 'en';
const VIEW_PREF_KEY = 'menu_view_preference';

const DEFAULT_CONFIG: OrderConfig = { orders_enabled: false, preorders_enabled: false, tables_count: 10, telegram_connected: false, waiter_call_enabled: false };

export default function MenuPage() {
  const { data, isLoading, error, slug, lang, setLang, table, menuId } = useMenu();
  const { i18n } = useTranslation();

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem(VIEW_PREF_KEY) as ViewMode) || 'list';
  });
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const cart = useCart(slug ?? '');

  const { data: orderConfig = DEFAULT_CONFIG } = useQuery<OrderConfig>({
    queryKey: ['order-config', slug, menuId],
    queryFn: () => getOrderConfig(slug!, menuId),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const ordersAvailable = orderConfig.orders_enabled || orderConfig.preorders_enabled;

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
    const props = {
      items: displayItems,
      onItemClick: handleItemClick,
      flaggedItemIds,
      onAddToCart: ordersAvailable ? (item: MenuItem) => cart.addItem({ item_id: item.id, name: item.name, price: item.price }) : undefined,
    };
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
          cartCount={ordersAvailable ? cart.totalCount : 0}
          onCartOpen={ordersAvailable ? () => setCartOpen(true) : undefined}
          plan={data.restaurant.plan}
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
                showAllergenFilter={data.restaurant.plan === 'pro'}
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

      <ItemModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onAddToCart={ordersAvailable ? (item) => {
          cart.addItem({ item_id: item.id, name: item.name, price: item.price });
          setSelectedItem(null);
        } : undefined}
      />

      {ordersAvailable && (
        <CartModal
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          items={cart.items}
          totalPrice={cart.totalPrice}
          onUpdateQty={cart.updateQuantity}
          onRemove={cart.removeItem}
          onClear={cart.clearCart}
          config={orderConfig}
          slug={slug ?? ''}
          menuId={menuId}
        />
      )}

      {orderConfig.waiter_call_enabled && slug && (
        <WaiterButton
          slug={slug}
          menuId={menuId}
          tablesCount={orderConfig.tables_count}
        />
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
