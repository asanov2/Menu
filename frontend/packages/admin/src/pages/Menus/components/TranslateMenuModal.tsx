import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon, useToast, getApiErrorMessage } from '@qrmenu/ui';
import { translateMenu } from '../../../api/translate';
import styles from './TranslateMenuModal.module.css';

interface Props {
  menuId: string;
  isOpen: boolean;
  onClose: () => void;
}

const LANGS = [
  { code: 'kz', label: 'Казахский (KZ)' },
  { code: 'en', label: 'Английский (EN)' },
] as const;

export default function TranslateMenuModal({ menuId, isOpen, onClose }: Props) {
  const { showToast } = useToast();
  const [selected, setSelected] = useState<string[]>(['kz', 'en']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ cats: number; items: number } | null>(null);

  const toggle = (code: string) => {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const handleTranslate = async () => {
    if (!selected.length) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await translateMenu(menuId, selected);
      setResult({ cats: res.translated_categories, items: res.translated_items });
      showToast(`Переведено: ${res.translated_categories} катег., ${res.translated_items} блюд`, 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Ошибка перевода'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.backdrop} onClick={handleClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>
            <Icon name="language" size={18} className={styles.titleIcon} />
            Перевести меню
          </span>
          <button className={styles.closeBtn} onClick={handleClose}>
            <Icon name="x" size={16} />
          </button>
        </div>

        <p className={styles.hint}>
          AI переведёт все категории и блюда на выбранные языки. Существующие переводы
          будут перезаписаны.
        </p>

        <div className={styles.langList}>
          {LANGS.map(({ code, label }) => (
            <label key={code} className={styles.langRow}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={selected.includes(code)}
                onChange={() => toggle(code)}
                disabled={loading}
              />
              <span className={styles.langLabel}>{label}</span>
            </label>
          ))}
        </div>

        {result && (
          <div className={styles.resultBox}>
            <Icon name="circle-check" size={16} className={styles.resultIcon} />
            Переведено {result.cats}&nbsp;кат. и {result.items}&nbsp;блюд
          </div>
        )}

        <div className={styles.footer}>
          <button className={styles.btnCancel} onClick={handleClose} disabled={loading}>
            {result ? 'Закрыть' : 'Отмена'}
          </button>
          {!result && (
            <button
              className={styles.btnTranslate}
              disabled={loading || !selected.length}
              onClick={handleTranslate}
            >
              {loading ? (
                <>
                  <span className={styles.spinner} />
                  Переводим…
                </>
              ) : (
                <>
                  <Icon name="sparkles" size={14} />
                  Перевести
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
