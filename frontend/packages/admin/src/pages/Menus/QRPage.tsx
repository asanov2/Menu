import { useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { Skeleton, PLAN } from '@qrmenu/ui';
import { getMenu } from '../../api/menus';
import { useAuth } from '../../hooks/useAuth';
import styles from './QRPage.module.css';

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
      <div className={styles.loadingCenter}>
        <Skeleton width="320px" height="420px" borderRadius="var(--radius-xl)" />
      </div>
    );
  }

  return (
    <>
      <div className={`${styles.noPrint} ${styles.backRow}`}>
        <div>
          <Link to={`/menus/${id}`} className={styles.backLink}>← Назад</Link>
        </div>
      </div>

      <div className={styles.center}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            {menu?.name}
          </div>

          {/* Main QR */}
          <div className={`${styles.qrCenter}`}>
            <div ref={canvasRef} className={styles.qrBg}>
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
          <div id="qr-svg" className={styles.hiddenSvg}>
            <QRCodeSVG value={qrValue || ' '} size={220} bgColor="#FFFFFF" fgColor="#1A1208" includeMargin />
          </div>

          {/* Table QR section */}
          {canTable && (
            <div className={`${styles.noPrint} ${styles.tableSection}`}>
              <div className={styles.tableSectionLabel}>QR на конкретный стол</div>
              <div className={styles.tableInputRow}>
                <input
                  type="number"
                  min={1}
                  placeholder="Номер стола"
                  value={tableNum}
                  onChange={(e) => setTableNum(e.target.value)}
                  className={styles.tableInput}
                />
                <button
                  onClick={() => setTableQR(tableNum ? `${qrValue}&table=${tableNum}` : '')}
                  className={styles.tableGenBtn}
                >
                  Сгенерировать
                </button>
              </div>
              {tableQR && (
                <div className={styles.tableQrResult}>
                  <div className={styles.tableQrBg}>
                    <QRCodeCanvas value={tableQR} size={140} bgColor="#FFFFFF" fgColor="#1A1208" includeMargin />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Download buttons */}
          <div className={`${styles.noPrint} ${styles.downloadRow}`}>
            <button onClick={downloadPNG} className={styles.btnDownload}>⬇ PNG</button>
            <button onClick={downloadSVG} className={styles.btnDownload}>⬇ SVG</button>
            <button onClick={() => window.print()} className={styles.btnPrint}>🖨 Печать</button>
          </div>
        </div>
      </div>
    </>
  );
}
