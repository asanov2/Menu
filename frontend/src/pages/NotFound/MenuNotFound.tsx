import { useTranslation } from 'react-i18next';

export default function MenuNotFound() {
  const { t } = useTranslation();

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--cream-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      <span style={{ fontSize: 72, marginBottom: 24, lineHeight: 1 }}>🍽️</span>
      <div
        style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 26,
          fontWeight: 600,
          color: 'var(--ink-primary)',
          marginBottom: 12,
          lineHeight: 1.2,
        }}
      >
        {t('errors.menuNotFoundTitle')}
      </div>
      <div
        style={{
          fontSize: 15,
          color: 'var(--ink-secondary)',
          lineHeight: 1.65,
          fontFamily: 'DM Sans, sans-serif',
          maxWidth: 280,
        }}
      >
        {t('errors.menuNotFoundDesc')}
      </div>
    </div>
  );
}
