import { useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { Skeleton, PLAN } from '@qrmenu/ui';
import { getMenu } from '../../api/menus';
import { useAuth } from '../../hooks/useAuth';

export default function QRPage() {
  const { id } = useParams<{ id: string }>();
  const { restaurant } = useAuth();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [tableNum, setTableNum] = useState('');
  const [tableQR, setTableQR] = useState('');

  const { data: menu, isLoading } = useQuery({
    queryKey: ['menu', id],
    queryFn: () => getMenu(id!),
    enabled: !!id,
  });

  const appUrl = import.meta.env.VITE_APP_URL ?? '';
  const qrValue = restaurant?.slug ? `${appUrl}/m/${restaurant.slug}` : '';
  const canTable = restaurant?.plan === PLAN.BUSINESS || restaurant?.plan === PLAN.PRO;

  const downloadPNG = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-${menu?.name ?? 'menu'}.png`;
    a.click();
  };

  const downloadSVG = () => {
    const svg = document.getElementById('qr-svg')?.querySelector('svg');
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-${menu?.name ?? 'menu'}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <Skeleton width="320px" height="420px" borderRadius="var(--radius-xl)" />
      </div>
    );
  }

  return (
    <>
      <style>{`@media print { .no-print { display: none !important; } .qr-center { display: flex; justify-content: center; margin: 40px auto; } }`}</style>

      <div className="no-print" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-ui)', fontSize: 13 }}>
          <Link to={`/menus/${id}`} style={{ color: 'var(--ink-secondary)', textDecoration: 'none' }}>← Назад</Link>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ background: 'var(--cream-bg)', border: '0.5px solid var(--cream-border)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-card)', padding: '36px 40px', maxWidth: 380, width: '100%' }}>
          <div style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--ink-primary)', marginBottom: 24 }}>
            {menu?.name}
          </div>

          {/* Main QR */}
          <div className="qr-center" style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div ref={canvasRef} style={{ background: 'var(--cream-surface)', padding: 12, borderRadius: 8 }}>
              <QRCodeCanvas
                value={qrValue || ' '}
                size={220}
                bgColor="#FFFFFF"
                fgColor="#1A1208"
                includeMargin
              />
            </div>
          </div>

          {/* Hidden SVG for download */}
          <div id="qr-svg" style={{ display: 'none' }}>
            <QRCodeSVG value={qrValue || ' '} size={220} bgColor="#FFFFFF" fgColor="#1A1208" includeMargin />
          </div>

          {/* Table QR section */}
          {canTable && (
            <div className="no-print" style={{ marginBottom: 24, padding: '16px', background: 'var(--cream-muted)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: 12, color: 'var(--ink-secondary)', fontFamily: 'var(--font-ui)', marginBottom: 10 }}>QR на конкретный стол</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="number"
                  min={1}
                  placeholder="Номер стола"
                  value={tableNum}
                  onChange={(e) => setTableNum(e.target.value)}
                  style={{ flex: 1, padding: '8px 10px', background: 'var(--cream-surface)', border: '0.5px solid var(--cream-border)', borderRadius: 'var(--radius-md)', fontSize: 13, fontFamily: 'var(--font-ui)', outline: 'none' }}
                />
                <button
                  onClick={() => setTableQR(tableNum ? `${qrValue}&table=${tableNum}` : '')}
                  style={{ padding: '8px 14px', background: 'var(--ink-primary)', color: 'var(--cream-surface)', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 13, fontFamily: 'var(--font-ui)', cursor: 'pointer' }}
                >
                  Сгенерировать
                </button>
              </div>
              {tableQR && (
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
                  <div style={{ background: 'var(--cream-surface)', padding: 10, borderRadius: 8 }}>
                    <QRCodeCanvas value={tableQR} size={140} bgColor="#FFFFFF" fgColor="#1A1208" includeMargin />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Download buttons */}
          <div className="no-print" style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button
              onClick={downloadPNG}
              style={{ flex: 1, padding: '9px', background: 'transparent', border: '1px solid var(--ink-primary)', color: 'var(--ink-primary)', borderRadius: 'var(--radius-md)', fontSize: 13, fontFamily: 'var(--font-ui)', cursor: 'pointer' }}
            >
              ⬇ PNG
            </button>
            <button
              onClick={downloadSVG}
              style={{ flex: 1, padding: '9px', background: 'transparent', border: '1px solid var(--ink-primary)', color: 'var(--ink-primary)', borderRadius: 'var(--radius-md)', fontSize: 13, fontFamily: 'var(--font-ui)', cursor: 'pointer' }}
            >
              ⬇ SVG
            </button>
            <button
              onClick={() => window.print()}
              style={{ flex: 1, padding: '9px', background: 'var(--ink-primary)', color: 'var(--cream-surface)', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 13, fontFamily: 'var(--font-ui)', cursor: 'pointer' }}
            >
              🖨 Печать
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
