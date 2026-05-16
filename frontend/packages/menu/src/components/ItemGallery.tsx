import { motion } from 'framer-motion';
import type { MenuItem } from '@qrmenu/ui';
import ItemCard from './ItemCard';
import styles from './ItemGallery.module.css';

interface ItemGalleryProps {
  items: MenuItem[];
  onItemClick: (item: MenuItem) => void;
}

export default function ItemGallery({ items, onItemClick }: ItemGalleryProps) {
  return (
    <div className={styles.grid}>
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
        >
          <ItemCard item={item} mode="gallery" onClick={() => onItemClick(item)} />
        </motion.div>
      ))}
    </div>
  );
}
