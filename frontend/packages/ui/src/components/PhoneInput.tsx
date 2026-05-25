import { useRef } from 'react';
import styles from './PhoneInput.module.css';

function extractDigits(val: string): string {
  return val.replace(/\D/g, '');
}

function applyMask(digits: string): string {
  const d = digits.startsWith('7') ? digits : (digits ? '7' + digits : '');
  const clean = d.slice(0, 11);
  if (!clean) return '';

  let result = '+7';
  if (clean.length === 1) return result;

  const area = clean.slice(1, 4);
  result += ' (' + area;
  if (area.length < 3) return result;
  result += ')';

  const p2 = clean.slice(4, 7);
  if (!p2.length) return result;
  result += ' ' + p2;
  if (p2.length < 3) return result;

  const p3 = clean.slice(7, 9);
  if (!p3.length) return result;
  result += '-' + p3;
  if (p3.length < 2) return result;

  const p4 = clean.slice(9, 11);
  if (p4.length) result += '-' + p4;

  return result;
}

export function validatePhone(value: string): boolean {
  const digits = extractDigits(value);
  const d = digits.startsWith('7') ? digits : '7' + digits;
  return d.length === 11;
}

export function normalizePhone(value: string): string {
  const digits = extractDigits(value);
  const d = digits.startsWith('7') ? digits : '7' + digits;
  return '+' + d.slice(0, 11);
}

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  inputClassName?: string;
  disabled?: boolean;
}

export function PhoneInput({
  value,
  onChange,
  error,
  placeholder = '+7 (___) ___-__-__',
  inputClassName,
  disabled,
}: PhoneInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = value ? applyMask(extractDigits(value)) : '';

  const handleFocus = () => {
    if (!displayValue) onChange('+7 ');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = extractDigits(raw);
    if (!digits) { onChange(''); return; }
    const normalized = digits.startsWith('7') ? digits : '7' + digits;
    onChange(applyMask(normalized));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const nav = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End'];
    if (nav.includes(e.key)) {
      if (e.key === 'Backspace' && (displayValue || '').length <= 3) {
        e.preventDefault();
      }
      return;
    }
    if (e.ctrlKey || e.metaKey) return;
    if (!/^\d$/.test(e.key)) { e.preventDefault(); return; }
    if (extractDigits(displayValue).length >= 11) e.preventDefault();
  };

  const handleBlur = () => {
    if (displayValue === '+7 ' || displayValue === '+7') onChange('');
  };

  return (
    <div className={styles.wrapper}>
      <input
        ref={inputRef}
        type="tel"
        value={displayValue}
        placeholder={placeholder}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={disabled}
        autoComplete="tel"
        inputMode="numeric"
        className={`${styles.input} ${inputClassName ?? ''} ${error ? styles.inputError : ''}`}
      />
      {error && <div className={styles.errorMsg}>{error}</div>}
    </div>
  );
}
