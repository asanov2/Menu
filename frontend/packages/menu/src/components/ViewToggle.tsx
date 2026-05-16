import { useTranslation } from 'react-i18next';
import styles from './ViewToggle.module.css';

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
    <div className={styles.bar}>
      {VIEWS.map(({ mode, icon, key }) => (
        <button
          key={mode}
          onClick={() => onViewModeChange(mode)}
          className={`${styles.viewBtn} ${viewMode === mode ? styles.viewBtnActive : ''}`}
        >
          <span className={styles.viewIcon}>{icon}</span>
          <span>{t(key)}</span>
        </button>
      ))}
    </div>
  );
}
