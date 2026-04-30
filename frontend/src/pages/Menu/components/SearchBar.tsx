import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  foundCount: number | null;
}

export default function SearchBar({ value, onChange, foundCount }: SearchBarProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      style={{
        padding: '8px 16px',
        background: 'var(--cream-bg)',
        borderBottom: '0.5px solid var(--cream-border)',
      }}
    >
      <div style={{ position: 'relative' }}>
        <span
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 14,
            color: 'var(--ink-tertiary)',
            pointerEvents: 'none',
          }}
        >
          🔍
        </span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('menu.searchPlaceholder')}
          style={{
            width: '100%',
            padding: '10px 36px',
            background: 'var(--cream-surface)',
            border: '0.5px solid var(--cream-border)',
            borderRadius: 10,
            fontSize: 14,
            color: 'var(--ink-primary)',
            outline: 'none',
            fontFamily: 'DM Sans, sans-serif',
            minHeight: 44,
          }}
        />
        {value && (
          <button
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
            style={{
              position: 'absolute',
              right: 4,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              color: 'var(--ink-tertiary)',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {value && foundCount !== null && (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: 'var(--ink-secondary)',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          {t('menu.found', { count: foundCount })}
        </div>
      )}
    </div>
  );
}
