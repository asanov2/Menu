import { useState } from 'react';
import { motion } from 'framer-motion';
import { callWaiter } from '../api/menu';

interface WaiterButtonProps {
  slug: string;
  table: number;
}

export default function WaiterButton({ slug, table }: WaiterButtonProps) {
  const [called, setCalled] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCall = async () => {
    if (loading || called) return;
    setLoading(true);
    try {
      await callWaiter(slug, table);
    } catch {
      // optimistic — show success regardless
    } finally {
      setLoading(false);
      setCalled(true);
      setTimeout(() => setCalled(false), 3000);
    }
  };

  return (
    <motion.button
      onClick={handleCall}
      whileTap={{ scale: 0.88 }}
      animate={{ scale: called ? [1, 1.15, 1] : 1 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed',
        bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
        right: 20,
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: called ? 'var(--tag-green-text)' : 'var(--ink-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(26,18,8,0.35)',
        cursor: loading ? 'default' : 'pointer',
        border: 'none',
        zIndex: 50,
        transition: 'background 0.3s',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {called ? (
        <motion.span
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          style={{ fontSize: 22, lineHeight: 1 }}
        >
          ✓
        </motion.span>
      ) : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
            stroke="var(--accent-gold)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </motion.button>
  );
}
