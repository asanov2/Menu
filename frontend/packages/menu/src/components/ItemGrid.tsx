import { motion } from 'framer-motion';
import type { MenuItem } from '@qrmenu/ui';
import ItemCard from './ItemCard';
import styles from './ItemGrid.module.css';

interface ItemGridProps {
  items: MenuItem[];
  onItemClick: (item: MenuItem) => void;
  flaggedItemIds?: Set<string>;
}

export default function ItemGrid({ items, onItemClick, flaggedItemIds }: ItemGridProps) {
  return (
    <div className={styles.grid}>
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          layout
          className={styles.item}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.4) }}
        >
          <ItemCard item={item} mode="card" onClick={() => onItemClick(item)} isFlagged={flaggedItemIds?.has(item.id)} />
        </motion.div>
      ))}
    </div>
  );
}
