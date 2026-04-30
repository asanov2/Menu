import { useTranslation } from 'react-i18next';
import { Category, Language, ViewMode } from '../../../types/menu';
import CategoryTabs from './CategoryTabs';
import ViewToggle from './ViewToggle';

interface MenuHeaderProps {
  restaurantName: string;
  cuisineType: string;
  tableNumber: string | null;
  lang: Language;
  onLangChange: (lang: Language) => void;
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (id: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const LANGS: { code: Language; label: string }[] = [
  { code: 'ru', label: 'RU' },
  { code: 'kz', label: 'ҚАЗ' },
  { code: 'en', label: 'EN' },
];

export default function MenuHeader({
  restaurantName,
  cuisineType,
  tableNumber,
  lang,
  onLangChange,
  categories,
  activeCategory,
  onCategoryChange,
  viewMode,
  onViewModeChange,
}: MenuHeaderProps) {
  const { t } = useTranslation();

  const subtitleParts = [
    tableNumber ? t('header.table', { number: tableNumber }) : null,
    cuisineType || null,
  ].filter(Boolean);

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 30 }}>
      {/* Top bar */}
      <div
        style={{
          background: '#1A1208',
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
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 22,
              fontWeight: 600,
              color: '#FDFAF5',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {restaurantName}
          </div>
          {subtitleParts.length > 0 && (
            <div
              style={{
                fontSize: 11,
                color: '#A09080',
                marginTop: 2,
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {subtitleParts.join(' · ')}
            </div>
          )}
        </div>

        {/* Language switcher */}
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          {LANGS.map(({ code, label }) => {
            const active = lang === code;
            return (
              <button
                key={code}
                onClick={() => onLangChange(code)}
                style={{
                  padding: '4px 7px',
                  borderRadius: 100,
                  fontSize: 11,
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: 500,
                  background: active ? '#D4A853' : 'transparent',
                  color: active ? '#1A1208' : '#A09080',
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

      {/* Category tabs */}
      <CategoryTabs
        categories={categories}
        activeId={activeCategory}
        onSelect={onCategoryChange}
      />

      {/* View toggle */}
      <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
    </div>
  );
}
