import type React from 'react';

export function useInputFocus(hasError: boolean) {
  return {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      e.target.style.borderColor = 'var(--accent-gold)';
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      e.target.style.borderColor = hasError
        ? 'var(--error-text)'
        : 'var(--cream-border)';
    },
  };
}
