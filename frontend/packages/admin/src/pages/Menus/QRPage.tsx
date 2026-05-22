import { useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { Skeleton, Icon } from '@qrmenu/ui';
import { getMenu } from '../../api/menus';
import { useAuth } from '../../hooks/useAuth';
import styles from './QRPage.module.css';

const QR_BG = '#FFFFFF';
const QR_FG = '#1A1208';

export default function QRPage() {
  const { id } = useParams<{ id: string }>();
  const { restaurant } = useAuth();
  const canvasRef = useRef<HTMLDivElement>(null);

  const { data: menu, isLoading } = useQuery({
    queryKey: ['menu', id],
    queryFn: () => getMenu(id!),
    enabled: !!id,
  });

  const appUrl = import.meta.env.VITE_APP_URL ?? '';
  const qrValue = restaurant?.slug && id
    ? `${appUrl}/menu/${restaurant.slug}?menu_id=${id}`
    : '';

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
                bgColor={QR_BG}
                fgColor={QR_FG}
                includeMargin
              />
            </div>
          </div>

          {/* Hidden SVG for download */}
          <div id="qr-svg" className={styles.hiddenSvg}>
            <QRCodeSVG value={qrValue || ' '} size={220} bgColor={QR_BG} fgColor={QR_FG} includeMargin />
          </div>

          {/* Download buttons */}
          <div className={`${styles.noPrint} ${styles.downloadRow}`}>
            <button onClick={downloadPNG} className={styles.btnDownload}>⬇ PNG</button>
            <button onClick={downloadSVG} className={styles.btnDownload}>⬇ SVG</button>
            <button onClick={() => window.print()} className={styles.btnPrint}><Icon name="printer" size={16} /> Печать</button>
          </div>
        </div>
      </div>
    </>
  );
}
