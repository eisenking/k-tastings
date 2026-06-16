# Magnum Opus — гид для AI-агента

ERP для кондитерской: склад, рецепты, производство, заказы, контент сайта.

## Быстрый старт

```bash
npm install
# .env в корне (не в git) — см. переменные ниже
npm run db:migrate
npm run dev
```

### Переменные `.env`

| Переменная | Назначение |
|------------|------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Секрет сессий (openssl rand -base64 32) |
| `BETTER_AUTH_URL` | URL приложения, обычно `http://localhost:3000` |

### Команды БД

| Команда | Когда использовать |
|---------|-------------------|
| `npm run db:migrate` | После `git pull` с новыми миграциями; первый запуск |
| `npm run db:generate` | После изменения `src/drizzle/schemas/` — создать SQL-миграцию |
| `npm run db:studio` | Просмотр данных в браузере (dev only) |

**Важно для агента:** перед `db:migrate` или `db:generate` — спросить подтверждение у пользователя. Не применять миграции к production без явного запроса.

Подробнее об архитектуре: [docs/architecture.md](docs/architecture.md).  
PostgreSQL MCP: [docs/mcp-postgres.md](docs/mcp-postgres.md).

## Где что лежит

| Что | Путь |
|-----|------|
| Server actions | `src/actions/<domain>/` |
| Маршруты и page UI | `src/app/` |
| Общие компоненты | `src/components/shared/` |
| shadcn UI | `src/components/ui/` (не редактировать без нужды) |
| Auth | `src/lib/auth/` |
| RBAC | `src/lib/auth/rbac.js` |
| Роли (источник истины) | `src/lib/constants/roles.js` |
| Схема БД | `src/drizzle/schemas/` → реэкспорт в `schema.ts` |
| Миграции | `src/drizzle/migrations/` |
| Аудит | `src/lib/audit/log.js` |
| Cursor rules | `.cursor/rules/` |

## Дашборды

| Маршрут | Кто видит в Navbar | Назначение |
|---------|-------------------|------------|
| `/admin` | admin | Пользователи, журнал, склады обеих локаций |
| `/office` | admin, office | Финансы, заказы |
| `/website` | admin, office | Каталог сайта |
| `/pastry` | admin, pastry | Склад и производство «Торты» |
| `/cafe` | admin, cafe | Склад «Кафе» |

Office не видит `/pastry` и `/cafe` в меню и не имеет доступа к складским actions (pastry/cafe). Работает только с `/office` и `/website` через `assertCanManageOrders`, `assertCanViewFinance`, `assertCanManageWebsite`.

## Перед изменениями

1. Прочитай [docs/architecture.md](docs/architecture.md) — если затрагиваешь новый слой или домен.
2. Следуй `.cursor/rules/server-actions.mdc` для actions.
3. RBAC — только через `assert*` из `rbac.js`; роли из `roles.js` (`nav-links.ts` импортирует оттуда же).
4. Минимальный diff; UI-тексты на русском.

## Паттерн server action (кратко)

```
requireUser → parseInput → assert* → db.transaction → logActivity → revalidatePath
```

Обёртка `withAction` → `{ ok, data }` / `{ ok: false, error }`.

Эталон: `src/actions/stock/products/addProduct.js`.

## Домены actions

```
src/actions/
  admin/       — пользователи, журнал активности
  stock/       — продукты, категории, приход, списание, перемещения
  recipes/     — рецепты, производство
  production/  — агрегаты для вкладки «Производство»
  website/     — каталог сайта (отдельно от складских продуктов)
```

## Что не делать

- Не массово конвертировать `.js` → `.ts` без запроса.
- Не трогать `src/components/ui/` без необходимости.
- Не использовать устаревшие пути: `src/app/main/`, `src/app/actions/`.
- Не добавлять тесты без запроса.
- Не коммитить без явной просьбы пользователя.

## Документация

- [architecture.md](docs/architecture.md) — слои, auth, потоки данных
- [domain/stock.md](docs/domain/stock.md) — склад, партии, FIFO, перемещения
- [domain/recipes.md](docs/domain/recipes.md) — рецепты, производство, состав
- [ ] `docs/conventions.md` — naming, структура файлов *(планируется)*

## Прогресс миграции (чекпоинт)

Обновлено: 2026-06-16.

| Шаг | Статус | Что сделано |
|-----|--------|-------------|
| 1 Security | ✅ | `guard.js`, layout RBAC, website actions |
| 2 Recipes UI | ✅ | `shared/recipes/*`, PreparationsTab → `{ ok, data }`, категории enum |
| 3 Импорты | ✅ | `@/actions/**`, `production/*`, TastingsTab, ProductionTab |
| 4 Мелочи | ✅ | `office` в admin users, `unwrapAction`, cleanup ProductsTab |

**Следующее (когда продолжишь):**

- Прогнать вручную вкладки `/pastry` (склад, заготовки, начинки, производство)
- `OrdersTab` — actions для заказов ещё не перенесены (`getOrders` и т.д.)
- Website actions — отдельный контракт `{ success }` (не `{ ok }`), унификация по желанию
- `/cafe` — проверить аналоги pastry-компонентов
- Закоммитить изменения, когда будешь готов
