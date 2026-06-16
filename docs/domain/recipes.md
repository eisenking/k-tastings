# Домен: Рецепты и производство

Рецепты описывают состав заготовок, начинок и блюд. Производство создаёт **партии** (`production_batches`) и списывает ингредиенты по FIFO.

## Типы рецептов

| type | Локация | Категория | Описание |
|------|---------|-----------|----------|
| `preparation` | pastry, cafe | обязательна | Заготовка (крем, бисквит, соус…) |
| `filling` | только `pastry` | **NULL** | Начинка / итоговое кондитерское изделие |
| `dish` | только `cafe` | обязательна | Блюдо меню |

Источник enum'ов: `src/drizzle/schemas/recipes/_enums.js`

### Категории по контексту

Ключ: `${location}:${type}` → список допустимых категорий в `RECIPE_CATEGORIES_BY_CONTEXT`.

Примеры:
- `pastry:preparation` → `creams`, `biscuits`, `soaks`, `other_pastry`
- `pastry:filling` → `[]` (категории нет)
- `cafe:dish` → `first_courses`, `main_courses`, `sides`, `desserts`

Валидация: zod в `_shared.js` + CHECK в схеме `recipes`.

## Модель данных

```
recipes (type, location, defaultYieldBase, category, isArchived)
    ↓
recipe_items (полиморфные ссылки)
    ├── refType: "product"    → products.id
    └── refType: "recipe"     → recipes.id (только preparation)
    ↓
production_batches (произведённые партии заготовок/начинок/блюд)
    ↓
production_consumptions (что списано на эту партию)
    ├── sourceType: "product_batch"
    └── sourceType: "production_batch"
```

Уникальность: `(name, type, location)` — одно имя может повторяться в разных типах или локациях.

## Состав рецепта

### Простые ингредиенты (`simpleItems`)

Продукты со склада той же локации:

```js
{ productId: uuid, amountBase: number }  // amountBase в г/мл
```

### Сложные группы (`complexGroups`)

При **создании** рецепта UI может передать группы — они разворачиваются в отдельные подрецепты:

```js
{
  name: "Крем",
  category: "creams",
  items: [{ productId, amountBase }, ...]
}
```

Логика: `buildRecipeItems` в `_shared.js`:
1. Создаёт `preparation`-рецепт с именем группы
2. Добавляет в него продукты
3. В parent-рецепт добавляет ссылку `refType: "recipe"` с `amountBase = sum(items)`

`defaultYieldBase` подрецепта = сумма ингредиентов.

### Полиморфные items в БД

| refType | productId | childRecipeId |
|---------|-----------|---------------|
| `product` | ✓ | null |
| `recipe` | null | ✓ (только `preparation`) |

Ограничения:
- Подрецепт только типа `preparation`
- Та же локация, что у parent
- Нельзя ссылаться на себя
- Нельзя использовать архивный подрецепт

## Правила create / update

### Create (`createRecipe`)

Action: `src/actions/recipes/createRecipe.js`

- Поля: `name`, `type`, `location`, `defaultYieldBase`, `category`, `note`, `simpleItems`, `complexGroups`
- RBAC: `assertCanModifyLocation`
- Уникальность имени в `(type, location)`

### Update (`updateRecipe`)

Action: `src/actions/recipes/updateRecipe.js`

**Нельзя менять** (не в схеме update):
- `type`
- `location`

Можно менять: `name`, `category`, `defaultYieldBase`, `note`, состав (`simpleItems`, `complexGroups`).

При update:
- Старые `recipe_items` parent-рецепта **удаляются** и создаются заново
- Подрецепты, созданные ранее через `complexGroups`, **не удаляются** — живут отдельно (могли уже произвестись)

### Archive (`archiveRecipe`)

Архивный рецепт нельзя редактировать или производить.

## Производство

### Action: `produceRecipe`

Файл: `src/actions/recipes/produceRecipe.js`  
Паттерн: `withAction`, RBAC, audit.

### Вход

```js
{
  recipeId: uuid,
  amountBase: number,           // сколько произвести (в base)
  expirationDate?: date,
  note?: string
}
```

### Алгоритм `produceInternal` (рекурсивный)

1. Защита от циклов (`visited` Set)
2. Загрузка рецепта + items
3. Создание `production_batch` (cost пока 0)
4. Множитель: `factor = amountBase / defaultYieldBase`
5. Для каждого item:
   - **product** → `consumeProductFIFO` (списание складских партий)
   - **recipe** → `consumePreparationFIFO` (списание партий заготовки)
6. Обновление `totalCost` / `unitCostBase` партии производства
7. `recalculateBalance` для всех затронутых продуктов

### FIFO продуктов (`consumeProductFIFO`)

- Партии `product_batches` по `received_at` FIFO
- Уменьшает `remainingBase`
- Movement `type: "production"`
- Запись в `production_consumptions` (`sourceType: "product_batch"`)

### FIFO заготовок (`consumePreparationFIFO`)

- Партии `production_batches` того же `recipeId` по `produced_at`
- Уменьшает `remainingBase`
- Запись в `production_consumptions` (`sourceType: "production_batch"`)
- **Авто-производство:** если остатка заготовки не хватает → рекурсивный `produceInternal` для недостающего объёма

### Себестоимость

```
unitCostBase = totalCost / amountBase
```

Стоимость партии = сумма себестоимостей всех списанных ингредиентов.

### Audit

- Корневое производство: `production_create` в основном action
- Вложенное авто-производство: отдельная запись с `metadata.auto: true`

## Связь с вкладками UI

| Вкладка (pastry) | type рецептов |
|------------------|---------------|
| Заготовки | `preparation` |
| Начинки | `filling` |
| Производство | агрегаты из `src/actions/production/` |

Cafe: заготовки (`preparation`) + блюда (`dish`).

## Actions (справочник)

```
src/actions/recipes/
  createRecipe.js
  updateRecipe.js
  archiveRecipe.js
  produceRecipe.js
  getRecipesByType.js
  getRecipeForDetailedView.js
  getRecipeTreeForDetailedView.js
  getProductionBatchesByRecipeType.js
  _shared.js                ← схемы, buildRecipeItems, хелперы

src/actions/production/     ← read-only агрегаты для UI «Производство»
  getPrepStockMap.js
  getFillingStockMap.js
  getProductStockMap.js
  getRecipeGraphForFillings.js
```

## Инварианты (для агента)

1. Все продукты в рецепте — **той же локации**, что рецепт.
2. Ингредиентом-рецептом может быть только `preparation`.
3. `filling` не имеет категории; `preparation`/`dish` — обязательно.
4. При производстве всегда списание FIFO + пересчёт балансов продуктов.
5. Не производить и не редактировать архивные рецепты.
6. `type` и `location` рецепта неизменяемы после создания.

## Связанные документы

- [stock.md](./stock.md) — партии продуктов, FIFO, единицы измерения
- [../architecture.md](../architecture.md) — общая архитектура
