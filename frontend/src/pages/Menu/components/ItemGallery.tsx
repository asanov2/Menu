import { motion } from 'framer-motion';
import { MenuItem } from '../../../types/menu';
import ItemCard from './ItemCard';

interface ItemGalleryProps {
  items: MenuItem[];
  onItemClick: (item: MenuItem) => void;
}

export default function ItemGallery({ items, onItemClick }: ItemGalleryProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 6,
        padding: '12px 16px',
      }}
    >
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
        >
          <ItemCard
            item={item}
            mode="gallery"
            onClick={() => onItemClick(item)}
          />
        </motion.div>
      ))}
    </div>
  );
}
