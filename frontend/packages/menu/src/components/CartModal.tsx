import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Z_INDEX, ANIMATION, formatPrice, Icon, PhoneInput, validatePhone } from '@qrmenu/ui';
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

  const [tab, setTab]                     = useState<Tab>(defaultTab);
  const [tableNumber, setTableNumber]     = useState(1);
  const [customerName, setCustomerName]   = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [comment, setComment]             = useState('');
  const [stage, setStage]                 = useState<Stage>('cart');
  const [successMsg, setSuccessMsg]       = useState('');
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [error, setError]                 = useState('');
  const [phoneError, setPhoneError]       = useState('');
  const [dragOffset, setDragOffset]       = useState(0);

  const touchStartY = useRef(0);

  const handleClose = () => {
    setDragOffset(0);
    onClose();
    // Сброс состояния после анимации закрытия
    setTimeout(() => {
      setStage('cart');
      setError('');
      setPhoneError('');
    }, 350);
  };

  /* ─── Drag-to-close ─── */
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) setDragOffset(delta);
  };

  const handleTouchEnd = () => {
    if (dragOffset > 80) {
      handleClose();
    } else {
      setDragOffset(0);
    }
  };

  /* ─── Submit ─── */
  const handleSubmit = async () => {
    setError('');
    setPhoneError('');
    if (items.length === 0) { setError('Корзина пуста'); return; }

    if (tab === 'preorder') {
      if (!customerName.trim()) { setError('Введите имя'); return; }
      if (!customerPhone.trim() || !validatePhone(customerPhone)) {
        setPhoneError('Введите корректный номер в формате +7 (XXX) XXX-XX-XX');
        return;
      }
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
      ...(tab === 'table'
        ? { table_number: tableNumber }
        : { customer_name: customerName.trim(), customer_phone: customerPhone.trim() }),
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
          {/* ─── Backdrop ─── */}
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

          {/* ─── Position wrapper (centers on desktop, bottom on mobile) ─── */}
          <div className={styles.positionWrapper} style={{ zIndex: Z_INDEX.modalInner }}>
            <motion.div
              key="cart-sheet-anim"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={styles.sheetMotion}
            >
              {/* ─── Sheet — drag transform applied here ─── */}
              <div
                className={styles.sheet}
                style={{
                  transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
                  transition: dragOffset === 0 ? 'transform 0.22s ease' : 'none',
                }}
              >
                {/* Drag handle area */}
                <div
                  className={styles.dragHandleArea}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <div className={styles.dragHandle} />
                </div>

                {/* Header */}
                <div className={styles.header}>
                  <div className={styles.headerLeft}>
                    <Icon name="shopping-cart" size={18} />
                    <span className={styles.title}>Корзина</span>
                  </div>
                  <button onClick={handleClose} className={styles.closeBtn} aria-label="Закрыть">
                    <Icon name="x" size={18} />
                  </button>
                </div>

                {/* Tabs */}
                {bothEnabled && stage === 'cart' && (
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

                {/* ─── Success screen ─── */}
                {stage === 'success' ? (
                  <div className={styles.successBlock}>
                    <div className={styles.successIconWrap}>
                      <Icon name="circle-check" size={52} />
                    </div>
                    <div className={styles.successMsg}>{successMsg}</div>
                    <button className={styles.submitBtn} onClick={handleClose}>
                      Закрыть
                    </button>
                  </div>
                ) : (
                  <>
                    {/* ─── Scrollable body ─── */}
                    <div className={styles.scrollBody}>

                      {/* Items list */}
                      {items.length === 0 ? (
                        <div className={styles.empty}>
                          <Icon name="shopping-cart-off" size={40} />
                          <span>Корзина пуста</span>
                        </div>
                      ) : (
                        <div className={styles.itemsList}>
                          {items.map((item) => (
                            <div key={item.item_id} className={styles.cartItem}>
                              <div className={styles.cartItemThumb}>
                                <Icon name="tools-kitchen-2" size={18} />
                              </div>
                              <div className={styles.cartItemInfo}>
                                <div className={styles.cartItemName}>{item.name}</div>
                                <div className={styles.cartItemPrice}>
                                  {formatPrice(item.price * item.quantity)}
                                </div>
                              </div>
                              <div className={styles.qtyControl}>
                                <button
                                  className={styles.qtyBtn}
                                  onClick={() => onUpdateQty(item.item_id, item.quantity - 1)}
                                  aria-label="Меньше"
                                >
                                  <Icon name="minus" size={13} />
                                </button>
                                <span className={styles.qtyNum}>{item.quantity}</span>
                                <button
                                  className={styles.qtyBtn}
                                  onClick={() => onUpdateQty(item.item_id, item.quantity + 1)}
                                  aria-label="Больше"
                                >
                                  <Icon name="plus" size={13} />
                                </button>
                              </div>
                              <button
                                className={styles.removeBtn}
                                onClick={() => onRemove(item.item_id)}
                                aria-label="Удалить"
                              >
                                <Icon name="trash" size={15} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Form */}
                      <div className={styles.form}>
                        {tab === 'table' && config.orders_enabled ? (
                          <>
                            <label className={styles.formLabel}>Номер стола</label>
                            <div className={styles.tableStepper}>
                              <button
                                type="button"
                                className={styles.tableStepBtn}
                                onClick={() => setTableNumber((n) => Math.max(1, n - 1))}
                                disabled={tableNumber <= 1}
                                aria-label="Предыдущий стол"
                              >
                                <Icon name="chevron-left" size={18} />
                              </button>
                              <span className={styles.tableStepValue}>Стол {tableNumber}</span>
                              <button
                                type="button"
                                className={styles.tableStepBtn}
                                onClick={() => setTableNumber((n) => Math.min(config.tables_count, n + 1))}
                                disabled={tableNumber >= config.tables_count}
                                aria-label="Следующий стол"
                              >
                                <Icon name="chevron-right" size={18} />
                              </button>
                            </div>
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
                            <PhoneInput
                              value={customerPhone}
                              onChange={(v) => { setCustomerPhone(v); setPhoneError(''); }}
                              error={phoneError}
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

                        {error && <div className={styles.errorMsg}>{error}</div>}
                      </div>
                    </div>

                    {/* ─── Sticky footer ─── */}
                    <div className={styles.footer}>
                      <div className={styles.totalRow}>
                        <span className={styles.totalLabel}>Итого</span>
                        <span className={styles.totalAmount}>{formatPrice(totalPrice)}</span>
                      </div>
                      <button
                        className={styles.submitBtn}
                        onClick={handleSubmit}
                        disabled={isSubmitting || items.length === 0}
                      >
                        {isSubmitting ? 'Отправка...' : 'Отправить заказ'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
