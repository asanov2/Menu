import { useTranslation } from 'react-i18next';
import type { Category } from '@qrmenu/ui';
import CategoryTabs from './CategoryTabs';
import ViewToggle, { ViewMode } from './ViewToggle';

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
}: MenuHeaderProps) {
  const { t } = useTranslation();

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      {/* Top bar */}
      <div
        style={{
          background: 'var(--sidebar-bg)',
          padding: '12px 16px 10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 8,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 600,
              color: 'var(--sidebar-text)',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {restaurantName}
          </div>
          {tableNumber && (
            <div style={{ fontSize: 11, color: 'var(--sidebar-muted)', marginTop: 2, fontFamily: 'var(--font-ui)' }}>
              {t('header.table', { number: tableNumber })}
            </div>
          )}
        </div>

        {/* Search toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <button
            onClick={onSearchToggle}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--sidebar-text)',
              fontSize: 18,
              padding: '4px 6px',
              opacity: 0.75,
              flexShrink: 0,
              lineHeight: 1,
              WebkitTapHighlightColor: 'transparent',
            }}
            aria-label="Поиск"
          >
            🔍
          </button>

          {/* Language switcher */}
          <div style={{ display: 'flex', gap: 2 }}>
            {LANGS.map(({ code, label }) => {
              const active = lang === code;
              return (
                <button
                  key={code}
                  onClick={() => onLangChange(code)}
                  style={{
                    padding: '4px 7px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 11,
                    fontFamily: 'var(--font-ui)',
                    fontWeight: 500,
                    background: active ? 'var(--accent-gold)' : 'transparent',
                    color: active ? 'var(--sidebar-bg)' : 'var(--sidebar-muted)',
                    border: 'none',
                    cursor: 'pointer',
                    minHeight: 28,
                    transition: 'all 0.15s',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
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
