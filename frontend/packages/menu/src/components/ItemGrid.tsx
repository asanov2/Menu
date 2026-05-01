import { motion } from 'framer-motion';
import type { MenuItem } from '@qrmenu/ui';
import ItemCard from './ItemCard';

interface ItemGridProps {
  items: MenuItem[];
  onItemClick: (item: MenuItem) => void;
}

export default function ItemGrid({ items, onItemClick }: ItemGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
        padding: '12px 16px',
      }}
    >
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.4) }}
        >
          <ItemCard item={item} mode="card" onClick={() => onItemClick(item)} />
        </motion.div>
      ))}
    </div>
  );
}
