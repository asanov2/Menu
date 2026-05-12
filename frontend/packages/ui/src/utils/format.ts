export function formatPrice(amount: number): string {
  return amount.toLocaleString('ru-RU') + ' ₸';
}

/**
 * Converts stored crop position (#pos=xFrac,yFrac) to CSS objectPosition.
 * xFrac/yFrac are signed normalized offsets: xFrac = -drag_x / frame_width.
 * Formula: objectPosition = (50 + frac*100)% — consistent across all container sizes.
 *
 * Examples:
 *   no hash        → "50% 50%"   (center)
 *   #pos=0,0       → "50% 50%"   (center)
 *   #pos=-0.0357,0 → "46.43% 50%" (shifted left — reveals left side)
 *   #pos=0.0357,0  → "53.57% 50%" (shifted right — reveals right side)
 */
export function getImageObjectPosition(url: string | null | undefined): string {
  if (!url) return '50% 50%';
  const hash = url.split('#')[1] ?? '';
  const m = hash.match(/pos=(-?[\d.]+),(-?[\d.]+)/);
  if (!m) return '50% 50%';
  const x = Math.max(0, Math.min(100, 50 + parseFloat(m[1]) * 100));
  const y = Math.max(0, Math.min(100, 50 + parseFloat(m[2]) * 100));
  return `${x.toFixed(2)}% ${y.toFixed(2)}%`;
}

/** Returns URL without crop hash fragment */
export function getCleanImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.split('#')[0];
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
