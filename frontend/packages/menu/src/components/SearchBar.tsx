import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  foundCount: number | null;
}

export default function SearchBar({ value, onChange, foundCount }: SearchBarProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={styles.wrapper}>
      <div className={styles.inputRow}>
        <i className="ti ti-search" style={{ fontSize: 16 }} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('menu.searchPlaceholder')}
          className={styles.input}
        />
        {value && (
          <button
            onClick={() => { onChange(''); inputRef.current?.focus(); }}
            className={styles.clearBtn}
          >
            <i className="ti ti-x" style={{ fontSize: 14 }} />
          </button>
        )}
      </div>

      {value && foundCount !== null && (
        <div className={styles.foundCount}>
          {t('menu.found', { count: foundCount })}
        </div>
      )}
    </div>
  );
}
