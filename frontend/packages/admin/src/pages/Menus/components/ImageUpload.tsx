// === FILE: frontend/packages/admin/src/pages/Menus/components/ImageUpload.tsx ===
import { useRef, useState } from 'react';
import { useToast } from '@qrmenu/ui';
import { uploadImage } from '../../../api/upload';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
}

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const [hover, setHover] = useState(false);
  const { showToast } = useToast();

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

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 15, 85));
    }, 150);

    try {
      const result = await uploadImage(file);
      clearInterval(progressInterval);
      setProgress(100);
      onChange(result.url);
      setTimeout(() => { setUploading(false); setProgress(0); }, 400);
    } catch {
      clearInterval(progressInterval);
      setUploading(false);
      setProgress(0);
      setPreview(value ?? null);
      showToast('Ошибка загрузки изображения', 'error');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  if (preview) {
    return (
      <div
        style={{ position: 'relative', width: '100%', height: 120, borderRadius: 'var(--radius-lg)', overflow: 'hidden', cursor: 'pointer' }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        {hover && (
          <div
            onClick={handleRemove}
            style={{
              position: 'absolute', inset: 0, background: 'rgba(26,18,8,0.55)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'white',
              fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 500,
            }}
          >
            🗑 Удалить
          </div>
        )}
        {uploading && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'rgba(255,255,255,0.3)' }}>
            <div style={{ height: '100%', background: 'var(--accent-gold)', width: `${progress}%`, transition: 'width 0.15s' }} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      style={{
        width: '100%',
        height: 120,
        border: '1.5px dashed var(--cream-border)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--cream-muted)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        gap: 8,
        boxSizing: 'border-box',
      }}
    >
      <span style={{ fontSize: 22 }}>📷</span>
      <span style={{ fontSize: 12, color: 'var(--ink-tertiary)', fontFamily: 'var(--font-ui)' }}>
        Перетащите фото или нажмите
      </span>
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
