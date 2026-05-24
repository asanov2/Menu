import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon, useToast, getApiErrorMessage } from '@qrmenu/ui';
import { generateDescription } from '../../../api/items';
import type { GenerateDescriptionParams } from '../../../api/items';
import styles from './GenerateDescriptionModal.module.css';

interface Props {
  isOpen: boolean;
  itemName: string;
  categoryName?: string | null;
  onInsert: (text: string) => void;
  onClose: () => void;
}

type Length = 'short' | 'medium' | 'long';
type Style = 'classic' | 'appetizing' | 'premium';
type Language = 'ru' | 'kz' | 'en';

const LENGTH_OPTIONS: { value: Length; label: string }[] = [
  { value: 'short', label: 'Короткое' },
  { value: 'medium', label: 'Среднее' },
  { value: 'long', label: 'Подробное' },
];

const STYLE_OPTIONS: { value: Style; label: string }[] = [
  { value: 'classic', label: 'Классический' },
  { value: 'appetizing', label: 'Аппетитный' },
  { value: 'premium', label: 'Премиум' },
];

const LANG_OPTIONS: { value: Language; label: string }[] = [
  { value: 'ru', label: 'RU' },
  { value: 'kz', label: 'KZ' },
  { value: 'en', label: 'EN' },
];

export default function GenerateDescriptionModal({ isOpen, itemName, categoryName, onInsert, onClose }: Props) {
  const { showToast } = useToast();
  const [length, setLength] = useState<Length>('medium');
  const [style, setStyle] = useState<Style>('appetizing');
  const [language, setLanguage] = useState<Language>('ru');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const params: GenerateDescriptionParams = {
        name: itemName,
        category_name: categoryName ?? null,
        length,
        style,
        language,
      };
      const text = await generateDescription(params);
      setResult(text);
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Ошибка генерации описания'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = () => {
    if (result) {
      onInsert(result);
      handleClose();
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
            <Icon name="sparkles" size={18} className={styles.titleIcon} />
            Генерация описания
          </span>
          <button className={styles.closeBtn} onClick={handleClose}>
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className={styles.body}>
          {/* Length */}
          <div className={styles.optionGroup}>
            <div className={styles.optionLabel}>Длина</div>
            <div className={styles.segmented}>
              {LENGTH_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`${styles.segBtn} ${length === value ? styles.segBtnActive : ''}`}
                  onClick={() => setLength(value)}
                  disabled={loading}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div className={styles.optionGroup}>
            <div className={styles.optionLabel}>Стиль</div>
            <div className={styles.segmented}>
              {STYLE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`${styles.segBtn} ${style === value ? styles.segBtnActive : ''}`}
                  onClick={() => setStyle(value)}
                  disabled={loading}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className={styles.optionGroup}>
            <div className={styles.optionLabel}>Язык</div>
            <div className={styles.segmented}>
              {LANG_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`${styles.segBtn} ${language === value ? styles.segBtnActive : ''}`}
                  onClick={() => setLanguage(value)}
                  disabled={loading}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          {!result && (
            <button
              type="button"
              className={styles.btnGenerate}
              disabled={loading || !itemName.trim()}
              onClick={handleGenerate}
            >
              {loading ? (
                <>
                  <span className={styles.spinner} />
                  Генерируем…
                </>
              ) : (
                <>
                  <Icon name="sparkles" size={14} />
                  Сгенерировать
                </>
              )}
            </button>
          )}

          {/* Preview */}
          {result && (
            <div className={styles.previewBlock}>
              <div className={styles.previewLabel}>Результат</div>
              <p className={styles.previewText}>{result}</p>
            </div>
          )}
        </div>

        {result && (
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.btnRegenerate}
              disabled={loading}
              onClick={handleGenerate}
            >
              {loading ? <span className={styles.spinnerDark} /> : <Icon name="refresh" size={14} />}
              Перегенерировать
            </button>
            <button
              type="button"
              className={styles.btnInsert}
              onClick={handleInsert}
            >
              <Icon name="check" size={14} />
              Вставить
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
