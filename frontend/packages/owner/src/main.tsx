import '@qrmenu/ui/src/styles/global.css';
import React from 'react';
import ReactDOM from 'react-dom/client';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'var(--font-ui)',
        color: 'var(--ink-secondary)',
        background: 'var(--cream-warm)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28,
            color: 'var(--ink-primary)',
            marginBottom: 8,
          }}
        >
          qrmenu.kz
        </div>
        <div>Owner dashboard — coming soon</div>
      </div>
    </div>
  </React.StrictMode>
);
