import { motion } from 'framer-motion';
import type { MenuItem } from '@qrmenu/ui';
import ItemCard from './ItemCard';
import styles from './ItemGallery.module.css';

interface ItemGalleryProps {
  items: MenuItem[];
  onItemClick: (item: MenuItem) => void;
  flaggedItemIds?: Set<string>;
  onAddToCart?: (item: MenuItem) => void;
}

export default function ItemGallery({ items, onItemClick, flaggedItemIds, onAddToCart }: ItemGalleryProps) {
  return (
    <div className={styles.grid}>
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          layout
          className={styles.item}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
        >
          <ItemCard item={item} mode="gallery" onClick={() => onItemClick(item)} isFlagged={flaggedItemIds?.has(item.id)} onAddToCart={onAddToCart} />
        </motion.div>
      ))}
    </div>
  );
}
