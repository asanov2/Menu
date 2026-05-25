# CLAUDE.md — qrmenus.kz
 
Этот файл читается автоматически. Следуй этим правилам в каждом запросе.
 
---
 
## О проекте
 
SaaS платформа для QR-меню ресторанов Казахстана.
Домен: **qrmenus.kz**
Владелец: Нурмухаммед Асанов
 
---
 
## Технический стек
 
### Backend — 6 FastAPI микросервисов
| Сервис | Порт внутри | Назначение |
|--------|-------------|------------|
| auth-service | 8002 | Регистрация, логин, JWT |
| admin-service | 8003 | Меню, категории, блюда, фото, AI функции |
| menu-service | 8001 | Публичное гостевое меню, заказы |
| billing-service | 8005 | Подписки, платежи |
| analytics-service | 8004 | Аналитика просмотров |
| owner-service | 8006 | Панель владельца платформы |
 
### Frontend — pnpm монорепо
```
frontend/
├── packages/ui/       — shared компоненты, CSS переменные, константы
├── packages/admin/    — панель ресторана (порт 8080)
├── packages/menu/     — гостевое меню (публичное)
└── packages/owner/    — панель владельца платформы (порт 8081)
```
 
### Инфраструктура
- PostgreSQL — основная БД
- Redis — кэш
- RabbitMQ — очередь событий аналитики
- MinIO — хранение фотографий блюд
- Nginx — reverse proxy
- Docker Compose — оркестрация
---
 
## Дизайн система — СТРОГО СОБЛЮДАТЬ
 
### CSS переменные (из packages/ui/src/styles/variables.css)
```css
--cream-bg: #FDFAF5
--cream-surface: #FFFFFF
--cream-border: #E8E0D0
--cream-muted: #F0EBE3
--cream-warm: #F5F0E8
--ink-primary: #1A1208
--ink-secondary: #A09080
--ink-tertiary: #C0B8A8
--accent-gold: #D4A853
--accent-gold-bg: #F8F0D8
--sidebar-bg: #1A1208
--font-display: 'Playfair Display', Georgia, serif
--font-ui: 'Golos Text', system-ui, sans-serif
--radius-sm: 6px
--radius-md: 10px
--radius-lg: 14px
--radius-xl: 20px
--shadow-card: 0 1px 3px rgba(26,18,8,0.06)
--shadow-modal: 0 20px 60px rgba(26,18,8,0.15)
```
 
### Иконки — ТОЛЬКО Tabler Icons через компонент Icon
```tsx
// ПРАВИЛЬНО:
import { Icon } from '@qrmenu/ui'
<Icon name="sparkles" size={16} />
<Icon name="brand-telegram" />
<Icon name="shopping-cart" />
 
// ЗАПРЕЩЕНО — никогда не использовать:
// ❌ эмодзи в JSX (🔔 📊 ✅)
// ❌ inline SVG вместо Icon компонента
// ❌ другие иконочные библиотеки
```
 
Исключение: эмодзи разрешены ТОЛЬКО в текстах Telegram сообщений (они отправляются как строки, не рендерятся в JSX).
 
### Стили
- Везде CSS Modules — никаких inline styles (кроме Recharts)
- Все цвета через CSS переменные — никаких хардкоженных hex
- Шрифты: Playfair Display для заголовков/названий блюд, Golos Text для UI
- Breakpoint мобильный: 768px
- Tap targets минимум 44×44px, шрифты минимум 11px
---
 
## Тарифные планы
 
| | Старт | Бизнес | Про |
|---|---|---|---|
| Цена | 3 900 ₸/мес | 9 900 ₸/мес | 24 900 ₸/мес |
| Меню | 1 | 5 | ∞ |
| Блюд | 50 | 200 | ∞ |
| Языки | RU | RU/KZ/EN | RU/KZ/EN |
| Перевод AI | ❌ | ✅ | ✅ |
| КБЖУ помощник AI | ❌ | ✅ | ✅ |
| Генерация описаний AI | ❌ | ❌ | ✅ |
| Аллергены | ❌ | ❌ | ✅ |
| Стоп-лист | ❌ | ✅ | ✅ |
| Поиск | ❌ | ✅ | ✅ |
| Заказ за столом | ❌ | ✅ | ✅ |
| Предзаказ | ❌ | ✅ | ✅ |
| Аналитика | 7 дней | 30 дней | 90 дней |
| Telegram сводка | ❌ | ❌ | ✅ |
| Поддержка | 24ч | 24ч | 2ч |
 
Константы планов: `packages/ui/src/constants/plans.ts`
Лимиты backend: `services/admin/app/core/plan_limits.py`
 
---
 
## Важные технические правила
 
### Image URLs
Хранить только как относительные `/images/items/UUID.ext` — НИКОГДА не `http://localhost/...`
 
### JWT и план
План берётся свежим из БД при каждом `verify-token` — НЕ из JWT payload.
 
### Timezone
Вся аналитика в `Asia/Almaty` (UTC+5). SQL запросы используют `AT TIME ZONE 'Asia/Almaty'`.
 
### Plan limits enforcement
- Backend проверяет лимиты в сервисах
- Возвращает `403` с `{"code": "PLAN_LIMIT_REACHED", "message": "...", "upgrade_to": "..."}`
- Frontend показывает `PlanLimitModal` через `isPlanLimitError()` из `planLimitError.ts`
### Сортировка
Категории и блюда сортируются по `sort_order`. Drag-and-drop обновляет `sort_order` в БД.
 
### Кэш Redis
Ключи меню: `menu:{slug}:{lang}` — инвалидировать при любых изменениях меню/блюд/категорий.
 
### AI endpoints — защита
Все AI endpoints защищены через `ai_guard.py`:
- Rate limit по restaurant_id
- Дневной лимит по restaurant_id
- Валидация длины входных данных
- Логирование каждого вызова
### Gemini API
Модель: `gemini-2.5-flash`
Ключ: `settings.gemini_api_key` из `.env`
Обработка ошибок: 429 → 503 с понятным сообщением пользователю
 
---
 
## Структура БД (основные таблицы)
 
```
restaurants (id, name, slug, email, plan, is_active, status,
             telegram_chat_id, telegram_connect_code, telegram_code_expires_at,
             orders_enabled, preorders_enabled, tables_count)
menus (id, restaurant_id, name, is_active, sort_order)
categories (id, menu_id, restaurant_id, name, sort_order, deleted_at)
items (id, category_id, restaurant_id, name, description, price,
       calories, protein, fat, carbs, sort_order, deleted_at)
item_allergens (item_id, allergen_code)
category_translations (id, category_id, language, name)
item_translations (id, item_id, language, name, description)
orders (id, restaurant_id, menu_id, order_type, table_number,
        customer_name, customer_phone, items JSONB, total_price, comment, created_at)
 
-- billing schema
billing.subscriptions (id, restaurant_id, plan, status, starts_at, ends_at)
billing.payments (id, restaurant_id, amount, plan, status, created_at)
 
-- analytics schema
analytics.analytics_events (id, restaurant_id, menu_id, item_id, event_type, created_at)
analytics.daily_aggregates (date, restaurant_id, menu_id, views, unique_visitors)
```
 
---
 
## Telegram бот
 
Username: `@qrmenuskz_bot`
Токен: `settings.telegram_bot_token` из `.env`
Отправка сообщений: через httpx POST к `https://api.telegram.org/bot{TOKEN}/sendMessage`
 
**Три функции бота:**
1. Webhook — приём кода подключения от владельца ресторана
2. Уведомления о заказах/предзаказах (план Business+)
3. Ежедневная сводка аналитики в 09:00 Asia/Almaty (план Pro)
---
 
## Маршруты
 
```
https://qrmenus.kz/           → лендинг
https://qrmenus.kz/menu/{slug} → гостевое меню
https://qrmenus.kz:8080/      → админ панель ресторана
https://qrmenus.kz:8081/      → owner панель (только Асанов)
https://qrmenus.kz/api/v1/auth/   → auth service
https://qrmenus.kz:8080/api/v1/   → admin + billing + analytics APIs
https://qrmenus.kz:8081/api/v1/   → owner API
https://qrmenus.kz/images/        → фотографии блюд (MinIO через nginx)
```
 
---
 
## Флоу регистрации ресторана
 
1. Ресторан регистрируется → статус `pending`, `is_active=false`
2. Нельзя войти пока `pending`
3. Owner одобряет → статус `active`, создаётся trial подписка 14 дней
4. Owner отклоняет → статус `inactive`, вход заблокирован
5. DB триггер синхронизирует `is_active` со `status`
---
 
## Команды разработки
 
```bash
# Запустить всё
docker compose up -d
 
# Пересобрать сервис
docker compose build {service} --no-cache && docker compose up -d {service}
 
# Логи
docker compose logs --tail=50 {service}
 
# Подключиться к БД
docker exec menu-postgres-1 psql -U qrmenu -d qrmenu
 
# Сбросить Redis кэш
docker compose exec redis redis-cli FLUSHDB
 
# Применить миграции
docker compose exec admin-service alembic upgrade head
```
 
---
 
## Чего НИКОГДА не делать
 
- ❌ Эмодзи в JSX компонентах — только Icon компонент
- ❌ Inline styles (кроме Recharts tooltipStyle и tick)
- ❌ Хардкоженные цвета hex — только CSS переменные
- ❌ Хранить image URL как абсолютный путь с localhost
- ❌ Читать план из JWT payload — только из БД
- ❌ Пробрасывать порты PostgreSQL/RabbitMQ/MinIO наружу в продакшне
- ❌ Коммитить .env.production в Git
