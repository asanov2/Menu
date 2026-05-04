import { useTranslation } from 'react-i18next';

export type ViewMode = 'list' | 'card' | 'gallery';

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
        background: 'var(--ink-primary)',
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
              borderRadius: 'var(--radius-full)',
              fontSize: 10,
              fontFamily: 'var(--font-ui)',
              fontWeight: 500,
              background: active ? 'var(--sidebar-bg)' : 'transparent',
              color: active ? 'var(--sidebar-text)' : 'var(--sidebar-muted)',
              border: active ? 'none' : '0.5px solid rgba(255,255,255,0.15)',
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
