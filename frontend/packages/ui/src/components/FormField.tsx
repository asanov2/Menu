import type { CSSProperties, ReactNode } from 'react';
import { LABEL_STYLE } from '../styles/shared';

interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
  required?: boolean;
  hint?: string;
}

export function FormField({ label, error, children, required, hint }: FormFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
      <label style={LABEL_STYLE}>
        {label}
        {required && <span style={{ color: 'var(--error-text)', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {hint && !error && (
        <span style={{ fontSize: 11, color: 'var(--ink-tertiary)', fontFamily: 'var(--font-ui)' }}>
          {hint}
        </span>
      )}
      {error && (
        <span style={{ fontSize: 11, color: 'var(--error-text)', fontFamily: 'var(--font-ui)' }}>
          {error}
        </span>
      )}
    </div>
  );
}
