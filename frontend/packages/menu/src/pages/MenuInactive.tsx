import { useTranslation } from 'react-i18next';

interface MenuInactiveProps {
  restaurantName?: string;
}

export default function MenuInactive({ restaurantName }: MenuInactiveProps) {
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
      <span style={{ fontSize: 64, lineHeight: 1, marginBottom: 20 }}>🚧</span>

      {restaurantName && (
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            fontWeight: 600,
            color: 'var(--ink-primary)',
            marginBottom: 6,
          }}
        >
          {restaurantName}
        </div>
      )}

      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 600,
          color: 'var(--ink-primary)',
          marginBottom: 12,
          lineHeight: 1.2,
        }}
      >
        {t('errors.menuInactiveTitle')}
      </div>

      <div
        style={{
          fontSize: 15,
          color: 'var(--ink-secondary)',
          lineHeight: 1.65,
          maxWidth: 280,
          fontFamily: 'var(--font-ui)',
        }}
      >
        {t('errors.menuInactiveDesc')}
      </div>
    </div>
  );
}
