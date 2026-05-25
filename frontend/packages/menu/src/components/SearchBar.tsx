import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@qrmenu/ui';
import { ALLERGENS } from '../constants/allergens';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  foundCount: number | null;
  selectedAllergens?: string[];
  onAllergenToggle?: (code: string) => void;
}

export default function SearchBar({
  value,
  onChange,
  foundCount,
  selectedAllergens = [],
  onAllergenToggle,
}: SearchBarProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const activeCount = selectedAllergens.length;

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
        <button
          className={`${styles.filterBtn} ${filterOpen ? styles.filterBtnOpen : ''} ${activeCount > 0 ? styles.filterBtnActive : ''}`}
          onClick={() => setFilterOpen((v) => !v)}
          aria-label="Фильтр по аллергенам"
        >
          <Icon name="adjustments-horizontal" size={15} />
          {activeCount > 0 && (
            <span className={styles.filterCount}>{activeCount}</span>
          )}
        </button>
      </div>

      {filterOpen && (
        <div className={styles.filterDropdown}>
          <div className={styles.filterTitle}>Фильтр по аллергенам</div>
          <div className={styles.filterGrid}>
            {ALLERGENS.map((allergen) => {
              const selected = selectedAllergens.includes(allergen.code);
              return (
                <label
                  key={allergen.code}
                  className={`${styles.filterRow} ${selected ? styles.filterRowSelected : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onAllergenToggle?.(allergen.code)}
                    className={styles.filterCheckbox}
                  />
                  <Icon name={allergen.icon} size={14} className={styles.filterIcon} />
                  <span className={styles.filterLabel}>{allergen.name_ru}</span>
                </label>
              );
            })}
          </div>
          {activeCount > 0 && (
            <button
              className={styles.filterClear}
              onClick={() => selectedAllergens.forEach((c) => onAllergenToggle?.(c))}
            >
              Сбросить фильтр
            </button>
          )}
        </div>
      )}

      {value && foundCount !== null && (
        <div className={styles.foundCount}>
          {t('menu.found', { count: foundCount })}
        </div>
      )}
    </div>
  );
}
