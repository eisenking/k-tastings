# Архитектура Magnum Opus

## Обзор

Монолитное Next.js-приложение (App Router). Бизнес-логика в **server actions**, данные в **PostgreSQL** через **Drizzle ORM**, авторизация через **better-auth**.

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Browser    │────▶│  Next.js (RSC +  │────▶│ PostgreSQL  │
│  (React 19) │◀────│  Server Actions) │◀────│  (Drizzle)  │
└─────────────┘     └──────────────────┘     └─────────────┘
                            │
                    better-auth (сессии)
```

## Слои приложения

### 1. Маршруты (`src/app/`)

- `page.jsx` — лендинг с формой входа
- `(auth)/sign-up` — регистрация
- `(dashboard)/` — защищённые разделы с общим layout (Navbar)
- `api/auth/[...all]` — HTTP-обработчик better-auth

**Защита маршрутов:** middleware отсутствует. Доступ контролируется:
- на уровне **server actions** (`requireUser` + RBAC);
- на уровне **Navbar** (ссылки фильтруются по роли — `nav-links.ts`, импортирует `ROLES` из `roles.js`).

### 2. Server Actions (`src/actions/`)

Единственная точка мутаций и большинства чтений с бизнес-правилами.

Стандартный pipeline:

1. `requireUser()` — сессия из better-auth
2. `parseInput(zodSchema, input)` — валидация
3. `assert*` из RBAC — права
4. `db.transaction` — атомарные изменения (для мутаций)
5. `logActivity` — аудит (внутри транзакции, с `tx`)
6. `revalidatePath` — инвалидация кэша RSC

Обёртка `withAction` нормализует ответ: `{ ok: true, data }` / `{ ok: false, error }`.

### 3. Библиотека (`src/lib/`)

| Модуль | Назначение |
|--------|------------|
| `auth/` | better-auth config, session helpers, RBAC |
| `utils/` | `withAction`, `parseInput`, errors, `unwrapAction` |
| `audit/` | `logActivity` → `activity_log` |
| `stock/` | `recalculateBalance` и др. складская логика |
| `helpers/units.js` | конвертация единиц в base (г/мл/шт) |
| `constants/roles.js` | роли и локации |

### 4. UI (`src/components/`)

- `ui/` — shadcn/ui (генерируемые примитивы)
- `shared/` — переиспользуемые блоки (stock, recipes, dataTable)
- `layout/navbar/` — навигация, auth-кнопка
- Page-specific UI — в `src/app/(dashboard)/<area>/_components/`

**Паттерн данных в RSC:**

```js
import { unwrapActionOr } from "@/lib/utils/unwrapAction";
const products = await unwrapActionOr(getProducts({ location }), []);
```

**Паттерн на клиенте:**

```js
const res = await myAction(input);
if (!res.ok) { toast.error(res.error); return; }
// использовать res.data
```

### 5. База данных (`src/drizzle/`)

- `schemas/` — таблицы по доменам
- `schema.ts` — единый реэкспорт
- `db.ts` — `drizzle(pool, { schema })`
- `migrations/` — SQL-миграции (drizzle-kit)

Конфиг: `drizzle.config.ts` (PostgreSQL, `DATABASE_URL`).

## Домены данных

### Auth (`schemas/auth/`)

better-auth: пользователи, сессии, роли. Плагины: `admin`, `username`.

### Stock (`schemas/stock/`)

Складская номенклатура **по локациям** (`pastry`, `cafe`):

```
product_categories → products → product_batches
                                      ↓
                              stock_movements
                              stock_balances (агрегат)
                              stock_transfers (между локациями)
```

- Партии (`product_batches`) — основа FIFO-учёта
- Баланс (`stock_balances`) пересчитывается через `recalculateBalance` после изменения партий
- Перемещения — только admin

### Recipes (`schemas/recipes/`)

```
recipes → recipe_items (ингредиенты)
              ↓
production_batches → production_consumptions
```

Типы рецептов и категории — в `schemas/recipes/_enums.js`.

### Website (`schemas/website/`)

Каталог для публичного сайта — **отдельно** от складских `products`.

### Audit (`schemas/audit/`)

`activity_log` — все значимые операции. Действия и сущности — enum'ы в `_enums.js`.

## Авторизация и RBAC

```
Запрос → better-auth session → requireUser() → user.role
                                                    ↓
                                          rbac.assert*(user, …)
```

| Роль | Локации | Особые права |
|------|---------|--------------|
| `admin` | все | пользователи, activity log, всё остальное |
| `office` | — | финансы, заказы, сайт (`/office`, `/website`) |
| `pastry` | только `pastry` | склад и производство своей локации |
| `cafe` | только `cafe` | склад своей локации |

Источник истины: `src/lib/constants/roles.js` + `src/lib/auth/rbac.js`.

## Поток типичной операции (приход товара)

```
AddProductDialog (client)
    → addProduct action
        → requireUser + assertCanModifyLocation
        → db.transaction:
            create/find product
            create product_batch
            create stock_movement
            recalculateBalance
            logActivity
        → revalidatePath
    → { ok, data } → toast / обновление UI
```

## Стек и версии

- Next.js 16, React 19
- Drizzle ORM + drizzle-kit
- better-auth
- shadcn/ui + Tailwind 4
- Zod 4, react-hook-form
- TypeScript (частично): strict mode, `allowJs: true`

## Известные ограничения

- Нет middleware — маршруты не блокируются на уровне Next.js
- Тестов нет
- Смешение `.js` (actions) и `.ts`/`.tsx` (auth, UI) — осознанное

## Связанные документы

- [AGENTS.md](../AGENTS.md) — краткий гид для агента
- `.cursor/rules/` — правила для Cursor AI
- [domain/stock.md](./domain/stock.md) — склад, партии, FIFO, перемещения
- [domain/recipes.md](./domain/recipes.md) — рецепты, производство, состав
