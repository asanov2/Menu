import { useState, useCallback, useEffect } from 'react';

export interface CartItem {
  item_id: string;
  name: string;
  quantity: number;
  price: number;
}

const getStorageKey = (slug: string) => `cart:${slug}`;

function loadCart(slug: string): CartItem[] {
  try {
    const raw = localStorage.getItem(getStorageKey(slug));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(slug: string, items: CartItem[]) {
  try {
    localStorage.setItem(getStorageKey(slug), JSON.stringify(items));
  } catch {}
}

export function useCart(slug: string) {
  const [items, setItems] = useState<CartItem[]>(() => loadCart(slug));

  useEffect(() => {
    saveCart(slug, items);
  }, [slug, items]);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.item_id === item.item_id);
      if (existing) {
        return prev.map((i) =>
          i.item_id === item.item_id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((i) => i.item_id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.item_id !== itemId));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.item_id === itemId ? { ...i, quantity: qty } : i))
      );
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return { items, totalPrice, totalCount, addItem, removeItem, updateQuantity, clearCart };
}
