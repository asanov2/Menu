import { motion } from 'framer-motion';
import { MenuItem } from '../../../types/menu';
import ItemCard from './ItemCard';

interface ItemListProps {
  items: MenuItem[];
  onItemClick: (item: MenuItem) => void;
}

export default function ItemList({ items, onItemClick }: ItemListProps) {
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
          <ItemCard
            item={item}
            mode="list"
            onClick={() => onItemClick(item)}
          />
        </motion.div>
      ))}
    </div>
  );
}
