import { useTranslation } from 'react-i18next';
import { ViewMode } from '../../../types/menu';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const VIEWS: { mode: ViewMode; icon: string; key: string }[] = [
  { mode: 'list', icon: '≡', key: 'views.list' },
  { mode: 'card', icon: '▦', key: 'views.card' },
  { mode: 'gallery', icon: '⊞', key: 'views.gallery' },
];

export default function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  const { t } = useTranslation();

  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        padding: '6px 16px 8px',
        background: '#221A10',
      }}
    >
      {VIEWS.map(({ mode, icon, key }) => {
        const active = viewMode === mode;
        return (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              borderRadius: 100,
              fontSize: 10,
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 500,
              background: active ? '#1A1208' : 'transparent',
              color: active ? '#FDFAF5' : '#A09080',
              border: active ? 'none' : '0.5px solid #403020',
              cursor: 'pointer',
              minHeight: 28,
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 11 }}>{icon}</span>
            <span>{t(key)}</span>
          </button>
        );
      })}
    </div>
  );
}
