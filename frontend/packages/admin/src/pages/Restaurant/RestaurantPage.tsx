import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { EmptyState, Icon } from '@qrmenu/ui';
import MenusPage from '../Menus/MenusPage';
import OrdersPage from './OrdersPage';
import styles from './RestaurantPage.module.css';
import common from '../../styles/common.module.css';

const RESTAURANT_TABS = [
  { to: 'menus',  label: 'Меню',    icon: 'tools-kitchen-2' },
  { to: 'orders', label: 'Заказы',  icon: 'receipt' },
  { to: 'calls',  label: 'Вызовы',  icon: 'bell-ringing' },
];

function CallsStub() {
  return (
    <EmptyState
      icon={<Icon name="bell-ringing" size={40} />}
      title="Вызовы официанта"
      description="Здесь скоро появятся вызовы официанта от гостей. Раздел находится в разработке."
    />
  );
}

export default function RestaurantPage() {
  return (
    <div className={common.pageWrapper}>
      <div className={styles.tabBar}>
        {RESTAURANT_TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => `${styles.tab} ${isActive ? styles.tabActive : ''}`}
          >
            <Icon name={tab.icon} size={15} />
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </div>

      <Routes>
        <Route index element={<Navigate to="menus" replace />} />
        <Route path="menus" element={<MenusPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="calls" element={<CallsStub />} />
      </Routes>
    </div>
  );
}
