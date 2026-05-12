// === FILE: frontend/packages/admin/src/pages/Menus/components/ImageUpload.tsx ===
import { useRef, useState, useEffect } from 'react';
import { useToast } from '@qrmenu/ui';
import { uploadImage } from '../../../api/upload';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onPositionChange?: (position: { x: number; y: number }) => void;
}

export default function ImageUpload({ value, onChange, onPositionChange }: ImageUploadProps) {
  const inputRef  = useRef<HTMLInputElement>(null);
  const frameRef  = useRef<HTMLDivElement>(null);
  const imgRef    = useRef<HTMLImageElement>(null);

  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [preview,   setPreview]   = useState<string | null>(value ?? null);
  const { showToast } = useToast();

  // Pan state
  const [position,    setPosition]    = useState({ x: 0, y: 0 });
  const [isDragging,  setIsDragging]  = useState(false);
  const [dragStart,   setDragStart]   = useState({ x: 0, y: 0 });
  const [posStart,    setPosStart]    = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    onPositionChange?.(position);
  }, [position, onPositionChange]);

  // Compute how large the image should be rendered to "cover" the square frame.
  const getDisplaySize = (): { w: number; h: number } | null => {
    if (!frameRef.current || naturalSize.w === 0) return null;
    const F     = frameRef.current.offsetWidth;
    const ratio = naturalSize.w / naturalSize.h;
    if (ratio >= 1) return { w: F * ratio, h: F };   // landscape
    return { w: F, h: F / ratio };                    // portrait
  };

  const clampPosition = (x: number, y: number) => {
    const display = getDisplaySize();
    if (!display || !frameRef.current) return { x, y };
    const maxX = Math.max(0, (display.w - frameRef.current.offsetWidth)  / 2);
    const maxY = Math.max(0, (display.h - frameRef.current.offsetHeight) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  };

  // ── Upload ──────────────────────────────────────────────────────────────────
  const handleFile = async (file: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      showToast('Только JPG, PNG, WebP', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Максимальный размер — 5 МБ', 'error');
      return;
    }

    setPosition({ x: 0, y: 0 });
    setNaturalSize({ w: 0, h: 0 });

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);
    setProgress(0);

    const timer = setInterval(() => setProgress((p) => Math.min(p + 15, 85)), 150);

    try {
      const result = await uploadImage(file);
      clearInterval(timer);
      setProgress(100);
      onChange(result.url);
      setTimeout(() => { setUploading(false); setProgress(0); }, 400);
    } catch {
      clearInterval(timer);
      setUploading(false);
      setProgress(0);
      setPreview(value ?? null);
      showToast('Ошибка загрузки изображения', 'error');
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setPosition({ x: 0, y: 0 });
    setNaturalSize({ w: 0, h: 0 });
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  // ── Mouse handlers ───────────────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!preview) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setPosStart({ ...position });
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition(clampPosition(posStart.x + e.clientX - dragStart.x, posStart.y + e.clientY - dragStart.y));
  };

  const handleMouseUp = () => setIsDragging(false);

  // ── Touch handlers ───────────────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!preview) return;
    const t = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: t.clientX, y: t.clientY });
    setPosStart({ ...position });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const t = e.touches[0];
    setPosition(clampPosition(posStart.x + t.clientX - dragStart.x, posStart.y + t.clientY - dragStart.y));
    e.preventDefault();
  };

  const handleTouchEnd = () => setIsDragging(false);

  // ── Render ───────────────────────────────────────────────────────────────────
  const display = getDisplaySize();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Square frame — always rendered */}
      <div
        ref={frameRef}
        style={{
          width: '100%',
          maxWidth: 300,
          aspectRatio: '1',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          background: 'var(--cream-muted)',
          position: 'relative',
          cursor: preview ? (isDragging ? 'grabbing' : 'grab') : 'default',
          border: '1.5px dashed var(--cream-border)',
          userSelect: 'none',
          boxSizing: 'border-box',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {preview ? (
          <>
            <img
              ref={imgRef}
              src={preview}
              alt="preview"
              draggable={false}
              onLoad={(e) => {
                const img = e.currentTarget;
                setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
              }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
                // Once we know natural size, render at exact cover dimensions.
                // Until then fall back to objectFit:cover to avoid flash.
                ...(display
                  ? { width: display.w, height: display.h, objectFit: 'fill' }
                  : { width: '100%', height: '100%', objectFit: 'cover' }),
                pointerEvents: 'none',
                transition: isDragging ? 'none' : 'transform 0.1s ease',
              }}
            />

            {/* Drag hint */}
            {!isDragging && (
              <div style={{
                position: 'absolute',
                bottom: 8,
                left: 0,
                right: 0,
                textAlign: 'center',
                fontSize: 10,
                color: 'rgba(255,255,255,0.85)',
                fontFamily: 'var(--font-ui)',
                pointerEvents: 'none',
                textShadow: '0 1px 2px rgba(0,0,0,0.6)',
              }}>
                ✥ Перетащите фото
              </div>
            )}

            {/* Remove button */}
            <button
              type="button"
              onClick={handleRemove}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.5)',
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

            {/* Upload progress bar */}
            {uploading && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.3)', zIndex: 3 }}>
                <div style={{ height: '100%', background: 'var(--accent-gold)', width: `${progress}%`, transition: 'width 0.15s' }} />
              </div>
            )}
          </>
        ) : (
          /* Empty state — click or drop to upload */
          <div
            onClick={() => inputRef.current?.click()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onDragOver={(e) => e.preventDefault()}
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 32 }}>🖼️</span>
            <span style={{
              fontSize: 12,
              color: 'var(--ink-secondary)',
              fontFamily: 'var(--font-ui)',
              textAlign: 'center',
              padding: '0 16px',
            }}>
              Нажмите чтобы загрузить фото
            </span>
          </div>
        )}
      </div>

      {/* Hidden file input */}
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
