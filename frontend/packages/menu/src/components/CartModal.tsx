import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Z_INDEX, ANIMATION, formatPrice } from '@qrmenu/ui';
import type { CartItem } from '../hooks/useCart';
import type { OrderConfig, OrderPayload } from '../api/menu';
import { submitOrder } from '../api/menu';
import styles from './CartModal.module.css';

interface CartModalProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  totalPrice: number;
  onUpdateQty: (itemId: string, qty: number) => void;
  onRemove: (itemId: string) => void;
  onClear: () => void;
  config: OrderConfig;
  slug: string;
}

type Tab = 'table' | 'preorder';
type Stage = 'cart' | 'success';

export default function CartModal({
  open, onClose, items, totalPrice, onUpdateQty, onRemove, onClear, config, slug,
}: CartModalProps) {
  const bothEnabled = config.orders_enabled && config.preorders_enabled;
  const defaultTab: Tab = config.orders_enabled ? 'table' : 'preorder';

  const [tab, setTab] = useState<Tab>(defaultTab);
  const [tableNumber, setTableNumber] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [comment, setComment] = useState('');
  const [stage, setStage] = useState<Stage>('cart');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    onClose();
    setStage('cart');
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    if (items.length === 0) { setError('Корзина пуста'); return; }

    if (tab === 'preorder') {
      if (!customerName.trim()) { setError('Введите имя'); return; }
      if (!customerPhone.trim()) { setError('Введите телефон'); return; }
    }

    const payload: OrderPayload = {
      order_type: tab,
      items: items.map((i) => ({
        item_id: i.item_id,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      })),
      total_price: totalPrice,
      comment: comment.trim() || undefined,
      ...(tab === 'table' ? { table_number: tableNumber } : {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
      }),
    };

    setIsSubmitting(true);
    try {
      const result = await submitOrder(slug, payload);
      setSuccessMsg(result.message);
      onClear();
      setStage('success');
    } catch {
      setError('Не удалось отправить заказ. Попробуйте ещё раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: ANIMATION.fadeMs }}
            className={styles.backdrop}
            style={{ zIndex: Z_INDEX.modal }}
            onClick={handleClose}
          />

          <motion.div
            key="cart-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={styles.sheet}
            style={{ zIndex: Z_INDEX.modalInner }}
          >
            <div className={styles.handle} />

            <div className={styles.header}>
              <span className={styles.title}>Корзина</span>
              <button onClick={handleClose} className={styles.closeBtn} aria-label="Закрыть">
                <i className="ti ti-x" style={{ fontSize: 18 }} />
              </button>
            </div>

            {stage === 'success' ? (
              <div className={styles.successBlock}>
                <i className="ti ti-circle-check-filled" style={{ fontSize: 48, color: '#22863a' }} />
                <div className={styles.successMsg}>{successMsg}</div>
                <button className={styles.submitBtn} onClick={handleClose}>Закрыть</button>
              </div>
            ) : (
              <div className={styles.body}>
                {/* Items list */}
                {items.length === 0 ? (
                  <div className={styles.empty}>
                    <i className="ti ti-shopping-cart-off" style={{ fontSize: 40 }} />
                    <div>Корзина пуста</div>
                  </div>
                ) : (
                  <div className={styles.itemsList}>
                    {items.map((item) => (
                      <div key={item.item_id} className={styles.cartItem}>
                        <div className={styles.cartItemName}>{item.name}</div>
                        <div className={styles.cartItemRight}>
                          <div className={styles.qtyControl}>
                            <button
                              className={styles.qtyBtn}
                              onClick={() => onUpdateQty(item.item_id, item.quantity - 1)}
                            >-</button>
                            <span className={styles.qtyNum}>{item.quantity}</span>
                            <button
                              className={styles.qtyBtn}
                              onClick={() => onUpdateQty(item.item_id, item.quantity + 1)}
                            >+</button>
                          </div>
                          <div className={styles.cartItemPrice}>
                            {formatPrice(item.price * item.quantity)}
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className={styles.total}>
                      <span>Итого</span>
                      <span className={styles.totalPrice}>{formatPrice(totalPrice)}</span>
                    </div>
                  </div>
                )}

                {/* Tabs */}
                {bothEnabled && (
                  <div className={styles.tabs}>
                    <button
                      className={`${styles.tab} ${tab === 'table' ? styles.tabActive : ''}`}
                      onClick={() => setTab('table')}
                    >
                      За столом
                    </button>
                    <button
                      className={`${styles.tab} ${tab === 'preorder' ? styles.tabActive : ''}`}
                      onClick={() => setTab('preorder')}
                    >
                      Предзаказ
                    </button>
                  </div>
                )}

                {/* Form */}
                <div className={styles.form}>
                  {tab === 'table' && config.orders_enabled ? (
                    <>
                      <label className={styles.formLabel}>Номер стола</label>
                      <select
                        className={styles.select}
                        value={tableNumber}
                        onChange={(e) => setTableNumber(parseInt(e.target.value))}
                      >
                        {Array.from({ length: config.tables_count }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>Стол {n}</option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <>
                      <label className={styles.formLabel}>Ваше имя *</label>
                      <input
                        className={styles.input}
                        type="text"
                        placeholder="Введите имя"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                      <label className={styles.formLabel}>Телефон *</label>
                      <input
                        className={styles.input}
                        type="tel"
                        placeholder="+7 (___) ___-__-__"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                      />
                    </>
                  )}

                  <label className={styles.formLabel}>Комментарий</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Пожелания к заказу..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                  />

                  {error && <div className={styles.error}>{error}</div>}

                  <button
                    className={styles.submitBtn}
                    onClick={handleSubmit}
                    disabled={isSubmitting || items.length === 0}
                  >
                    {isSubmitting ? 'Отправка...' : 'Отправить заказ'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
