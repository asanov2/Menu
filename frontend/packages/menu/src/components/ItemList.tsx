import { motion } from 'framer-motion';
import type { MenuItem } from '@qrmenu/ui';
import ItemCard from './ItemCard';

interface ItemListProps {
  items: MenuItem[];
  onItemClick: (item: MenuItem) => void;
  flaggedItemIds?: Set<string>;
}

export default function ItemList({ items, onItemClick, flaggedItemIds }: ItemListProps) {
  return (
    <div>
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.4) }}
        >
          <ItemCard item={item} mode="list" onClick={() => onItemClick(item)} isFlagged={flaggedItemIds?.has(item.id)} />
        </motion.div>
      ))}
    </div>
  );
}
