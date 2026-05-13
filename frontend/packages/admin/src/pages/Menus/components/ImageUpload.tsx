// === FILE: frontend/packages/admin/src/pages/Menus/components/ImageUpload.tsx ===
import { useRef, useState, useCallback, useEffect } from 'react';
import { useToast } from '@qrmenu/ui';
import { uploadImage } from '../../../api/upload';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onPositionChange?: (pos: { x: number; y: number }) => void;
}

// Stored format: #pos=xFrac,yFrac
//   xFrac = -position.x / frame_width  (negative so positive drag = lower %)
//   yFrac = -position.y / frame_width
// Display: objectPosition = `${50 + xFrac*100}% ${50 + yFrac*100}%`
// This gives identical crop in ANY objectFit:cover container size.

function parseFracs(url: string): { cleanUrl: string; xFrac: number; yFrac: number } {
  const [cleanUrl, hash = ''] = url.split('#');
  const m = hash.match(/pos=(-?[\d.]+),(-?[\d.]+)/);
  return {
    cleanUrl,
    xFrac: m ? parseFloat(m[1]) : 0,
    yFrac: m ? parseFloat(m[2]) : 0,
  };
}

function fracsToPixels(xFrac: number, yFrac: number, frameWidth: number) {
  return {
    x: -xFrac * frameWidth,
    y: -yFrac * frameWidth,
  };
}

export default function ImageUpload({ value, onChange, onPositionChange }: ImageUploadProps) {
  const inputRef   = useRef<HTMLInputElement>(null);
  const frameRef   = useRef<HTMLDivElement>(null);

  const [uploading,   setUploading]   = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [preview,     setPreview]     = useState<string | null>(null);
  const [position,    setPosition]    = useState({ x: 0, y: 0 });
  const [isDragging,  setIsDragging]  = useState(false);
  const [dragStart,   setDragStart]   = useState({ x: 0, y: 0 });
  const [posStart,    setPosStart]    = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });

  const { showToast } = useToast();

  // Refs for stable closures (avoid stale values in callbacks / timeouts)
  const positionRef    = useRef({ x: 0, y: 0 });
  const uploadedUrlRef = useRef<string | null>(null);
  const onChangeRef    = useRef(onChange);
  const saveTimerRef   = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => () => clearTimeout(saveTimerRef.current), []);

  // ── Restore state from value prop (modal re-opens with existing item) ────────
  useEffect(() => {
    if (value) {
      const { cleanUrl, xFrac, yFrac } = parseFracs(value);
      if (cleanUrl !== uploadedUrlRef.current) {
        uploadedUrlRef.current = cleanUrl;
        setPreview(cleanUrl);
      }
      const frameWidth = frameRef.current?.offsetWidth ?? 280;
      const px = fracsToPixels(xFrac, yFrac, frameWidth);
      if (px.x !== positionRef.current.x || px.y !== positionRef.current.y) {
        positionRef.current = px;
        setPosition(px);
      }
    } else {
      if (uploadedUrlRef.current !== null) {
        uploadedUrlRef.current = null;
        setPreview(null);
      }
      if (positionRef.current.x !== 0 || positionRef.current.y !== 0) {
        positionRef.current = { x: 0, y: 0 };
        setPosition({ x: 0, y: 0 });
      }
    }
  }, [value]);

  useEffect(() => { onPositionChange?.(position); }, [position, onPositionChange]);

  // ── Core save logic ──────────────────────────────────────────────────────────
  const savePositionNow = useCallback((pos: { x: number; y: number }) => {
    const url = uploadedUrlRef.current;
    if (!url) return;
    const frameWidth = frameRef.current?.offsetWidth ?? 280;
    // Convert pixels → normalized fractions (sign flip: positive drag = negative frac)
    const xFrac = -(pos.x / frameWidth);
    const yFrac = -(pos.y / frameWidth);
    const hasCrop = Math.abs(xFrac) > 0.001 || Math.abs(yFrac) > 0.001;
    const finalUrl = hasCrop
      ? `${url}#pos=${xFrac.toFixed(4)},${yFrac.toFixed(4)}`
      : url;
    onChangeRef.current(finalUrl);
  }, []);

  // ── Clamp helpers ────────────────────────────────────────────────────────────
  const getMaxOffset = useCallback(() => {
    if (!frameRef.current || naturalSize.w === 0) return { x: 0, y: 0 };
    const F     = frameRef.current.offsetWidth;
    const ratio = naturalSize.w / naturalSize.h;
    if (ratio >= 1) return { x: Math.max(0, (F * ratio - F) / 2), y: 0 };
    return { x: 0, y: Math.max(0, (F / ratio - F) / 2) };
  }, [naturalSize]);

  const clamp = useCallback((x: number, y: number) => {
    const max = getMaxOffset();
    return {
      x: Math.max(-max.x, Math.min(max.x, x)),
      y: Math.max(-max.y, Math.min(max.y, y)),
    };
  }, [getMaxOffset]);

  // ── applyPosition: update state + debounced save ─────────────────────────────
  const applyPosition = useCallback((pos: { x: number; y: number }) => {
    positionRef.current = pos;
    setPosition(pos);
    // Debounce: save 300ms after last move (covers submit-while-dragging)
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => savePositionNow(pos), 300);
  }, [savePositionNow]);

  // ── endDrag: immediate save on release ───────────────────────────────────────
  const endDrag = useCallback(() => {
    setIsDragging(false);
    clearTimeout(saveTimerRef.current); // cancel pending debounce
    savePositionNow(positionRef.current); // save immediately on release
  }, [savePositionNow]);

  // ── Upload ───────────────────────────────────────────────────────────────────
  const handleFile = async (file: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) { showToast('Только JPG, PNG, WebP', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { showToast('Максимальный размер — 5 МБ', 'error'); return; }

    clearTimeout(saveTimerRef.current);
    positionRef.current = { x: 0, y: 0 };
    setPosition({ x: 0, y: 0 });
    setNaturalSize({ w: 0, h: 0 });
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setProgress(0);

    const timer = setInterval(() => setProgress((p) => Math.min(p + 15, 85)), 150);
    try {
      const result = await uploadImage(file);
      clearInterval(timer);
      setProgress(100);
      uploadedUrlRef.current = result.url; // set ref BEFORE onChange to break loop
      onChangeRef.current(result.url);
      setTimeout(() => { setUploading(false); setProgress(0); }, 400);
    } catch {
      clearInterval(timer);
      setUploading(false);
      setProgress(0);
      if (value) {
        const { cleanUrl, xFrac, yFrac } = parseFracs(value);
        const frameWidth = frameRef.current?.offsetWidth ?? 280;
        setPreview(cleanUrl);
        const px = fracsToPixels(xFrac, yFrac, frameWidth);
        positionRef.current = px;
        setPosition(px);
      } else {
        setPreview(null);
      }
      showToast('Ошибка загрузки изображения', 'error');
    }
  };

  const handleRemove = () => {
    clearTimeout(saveTimerRef.current);
    setPreview(null);
    uploadedUrlRef.current = null;
    positionRef.current = { x: 0, y: 0 };
    setPosition({ x: 0, y: 0 });
    setNaturalSize({ w: 0, h: 0 });
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  // ── Mouse handlers ───────────────────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    if (!preview) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setPosStart({ ...positionRef.current });
    e.preventDefault();
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    applyPosition(clamp(posStart.x + (e.clientX - dragStart.x), posStart.y + (e.clientY - dragStart.y)));
  };

  // ── Touch handlers ───────────────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    if (!preview) return;
    const t = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: t.clientX, y: t.clientY });
    setPosStart({ ...positionRef.current });
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const t = e.touches[0];
    applyPosition(clamp(posStart.x + (t.clientX - dragStart.x), posStart.y + (t.clientY - dragStart.y)));
    e.preventDefault();
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Square crop frame */}
      <div
        ref={frameRef}
        style={{
          width: '100%',
          aspectRatio: '1 / 1',
          maxWidth: 280,
          margin: '0 auto',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          position: 'relative',
          background: 'var(--cream-muted)',
          border: preview ? '2px solid var(--accent-gold)' : '2px dashed var(--cream-border)',
          cursor: preview ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
          userSelect: 'none',
          touchAction: 'none',
          boxSizing: 'border-box',
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={endDrag}
        onClick={() => !preview && inputRef.current?.click()}
      >
        {preview ? (
          <>
            {/* Internal preview uses calc(px) — identical to stored formula in this frame */}
            <img
              src={preview}
              alt="preview"
              draggable={false}
              onLoad={(e) => {
                const img = e.currentTarget;
                setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
              }}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: `calc(50% + ${position.x}px) calc(50% + ${position.y}px)`,
                pointerEvents: 'none',
                display: 'block',
              }}
            />

            {!isDragging && (
              <div style={{
                position: 'absolute',
                bottom: 8,
                left: 0,
                right: 0,
                textAlign: 'center',
                fontSize: 11,
                color: 'rgba(255,255,255,0.9)',
                fontFamily: 'var(--font-ui)',
                pointerEvents: 'none',
                textShadow: '0 1px 3px rgba(0,0,0,0.6)',
              }}>
                ✥ Перетащите фото
              </div>
            )}

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleRemove(); }}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.55)',
                border: 'none',
                color: 'white',
                fontSize: 16,
                lineHeight: 1,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
              }}
            >
              ×
            </button>

            {uploading && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.3)', zIndex: 3 }}>
                <div style={{ height: '100%', background: 'var(--accent-gold)', width: `${progress}%`, transition: 'width 0.15s' }} />
              </div>
            )}
          </>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 36 }}>🖼️</span>
            <span style={{ fontSize: 12, color: 'var(--ink-secondary)', fontFamily: 'var(--font-ui)', textAlign: 'center', padding: '0 16px' }}>
              Нажмите для загрузки
              <br />
              <span style={{ fontSize: 10, color: 'var(--ink-tertiary)' }}>JPG, PNG, WEBP · до 5MB</span>
            </span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        style={{
          display: 'block',
          width: '100%',
          maxWidth: 280,
          margin: '8px auto 0',
          padding: '8px',
          background: 'var(--cream-muted)',
          border: '0.5px solid var(--cream-border)',
          borderRadius: 'var(--radius-sm)',
          fontFamily: 'var(--font-ui)',
          fontSize: 12,
          color: 'var(--ink-secondary)',
          cursor: 'pointer',
          boxSizing: 'border-box',
        }}
      >
        {preview ? '📷 Заменить фото' : '📷 Выбрать фото'}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}
