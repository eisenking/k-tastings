# Домен: Склад

Складская номенклатура привязана к **локации** (`pastry` или `cafe`). Одно и то же название продукта в разных локациях — **разные записи** в `products`.

## Модель данных

```
product_categories (по локации)
        ↓
    products (measure, baseUnit, pieceToBase)
        ↓
product_batches (партии: receivedBase, remainingBase, unitCostBase)
        ↓
stock_movements (журнал операций по партии)
        ↓
stock_balances (агрегат: totalAmount, avgUnitCost) — кэш для UI
```

Дополнительно: `stock_transfers` — заголовок перемещения между локациями.

### Ключевые таблицы

| Таблица | Назначение |
|---------|------------|
| `products` | Номенклатура: имя, категория, мера, базовая единица |
| `product_batches` | Партия прихода; **источник истины для FIFO** — поле `remainingBase` |
| `stock_movements` | Аудит/история: приход, списание, перемещение, производство |
| `stock_balances` | Денормализованный остаток; пересчитывается после изменения партий |
| `stock_transfers` | Перемещение pastry ↔ cafe |

## Единицы измерения

Все количества в БД хранятся в **базовых единицах**: граммы (`g`) или миллилитры (`ml`).

### Меры продукта (`measure`)

| measure | baseUnit | Описание |
|---------|----------|----------|
| `mass` | `g` | Масса (кг → г при вводе) |
| `volume` | `ml` | Объём (л → мл при вводе) |
| `piece` | `g` или `ml` | Штучный; `pieceToBase` = сколько г/мл в 1 шт |

Константы: `src/lib/constants/units.js`  
Конвертация: `src/lib/helpers/units.js` (`toBase`, `assertUnitCompatible`)

### Единицы ввода в UI

`g`, `kg`, `ml`, `l`, `pcs` — пользователь вводит в форме прихода; action конвертирует в base.

## FIFO-учёт

**Принцип:** списание всегда идёт из самых старых партий (`ORDER BY received_at, id`).

### Источник остатка

Актуальный остаток партии — поле `product_batches.remainingBase`.  
Оно уменьшается при списании/производстве/перемещении.  
`stock_movements` — журнал для истории и отчётов, не пересчитывается на лету.

### Общий хелпер: `consumeFifoBatches`

Файл: `src/actions/stock/products/_shared.js`

```js
const { consumed, totalCost, singleSourceBatchId } = await consumeFifoBatches(tx, {
    productId,
    location,
    amountBase,
});
```

- Блокирует партии `FOR UPDATE`
- Списывает по FIFO, уменьшает `remainingBase`
- Возвращает разбивку по партиям и общую себестоимость
- Если не хватает — `ConflictError`

Используется в: `writeOffFifo`, `transferProduct`, косвенно в производстве (`produceRecipe`).

### Пересчёт баланса

После любого изменения партий вызывать:

```js
await recalculateBalance(tx, { productId, location });
```

Файл: `src/lib/stock/updateBalance.js`  
Считает `SUM(remaining_base)` и средневзвешенную себестоимость → upsert в `stock_balances`.

## Операции

### Приход (`addProduct`)

Action: `src/actions/stock/products/addProduct.js`

Две ветки (union-схема `addProductSchema`):

1. **Приход в существующий** — `productId` + `batch`
2. **Новый продукт + первая партия** — поля продукта + `batch`

Шаги в транзакции:
1. Создать/найти продукт (имя уникально в рамках локации)
2. Конвертировать qty в base (`toBase`)
3. Создать `product_batch` (`receivedBase = remainingBase = qtyBase`)
4. Записать movement `type: "receipt"`
5. `recalculateBalance`
6. `logActivity` (`stock_receipt`)

RBAC: `assertCanModifyLocation`

### Списание (`writeOffFifo`)

Action: `src/actions/stock/products/writeOffFifo.js`

1. `consumeFifoBatches` — уменьшает `remainingBase`
2. Movement `write_off` — **по одному на каждую затронутую партию** (трассируемость)
3. `recalculateBalance`
4. `logActivity` (`stock_write_off`)

Обязательное поле: `reason` (причина списания).

### Перемещение (`transferProduct`)

Action: `src/actions/stock/products/transferProduct.js`

RBAC: **только** `assertCanTransfer` (admin).

Поток:
1. Source-продукт в `fromLocation`
2. Destination-продукт: ищется по **имени** в `toLocation`; если нет — создаётся
   - Категория: явно из input → или авто по одноимённой категории → иначе ошибка
   - `measure` / `baseUnit` / `pieceToBase` копируются с источника
3. FIFO-списание из source (`consumeFifoBatches`)
4. Заголовок `stock_transfers`
5. Одна destination-партия со взвешенной `unitCostBase`
6. Movements: `transfer_out` (по source-партиям) + `transfer_in` (один)
7. `recalculateBalance` для обеих локаций
8. `logActivity` (`stock_transfer`)

Связь партий: `destination_batch.source_batch_id` → исходная партия (если списано из одной).

### История (`getProductHistory`)

Action: `src/actions/stock/products/getProductHistory.js`  
Фильтры: тип movement, даты, пагинация.

## Типы движений (`stock_movement_type`)

| Код | Когда |
|-----|-------|
| `receipt` | Приход партии |
| `write_off` | Ручное списание |
| `transfer_out` | Выдача при перемещении |
| `transfer_in` | Приём при перемещении |
| `production` | Списание на производство (из `produceRecipe`) |

Для `transfer_in` / `transfer_out` обязателен `transfer_id` (CHECK в схеме).

## Правила и ограничения

1. **Имя продукта уникально в локации** — нельзя два «Сахар» в `pastry`.
2. **Категория принадлежит локации** — нельзя привязать продукт к чужой категории.
3. **Перемещения** — только admin; локационные роли не могут.
4. **Партия не может иметь отрицательный остаток** — CHECK `remaining_base >= 0`.
5. **После мутации партий** — всегда `recalculateBalance`.
6. **Не путать** складские `products` с `website_products` — это разные сущности.

## Actions (справочник)

```
src/actions/stock/
  products/
    addProduct.js
    getProducts.js
    getProductSuggestions.js
    getProductHistory.js
    writeOffFifo.js
    transferProduct.js
    _shared.js          ← схемы, FIFO, хелперы
  categories/
    getProductCategories.js
    createProductCategory.js
    updateProductCategory.js
    archiveProductCategory.js
```

## UI

Общие компоненты: `src/components/shared/stock/`  
- `ProductsTab.jsx` — список (RSC + `unwrapActionOr`)
- `AddProductDialog.jsx` — приход
- `WriteOffDialogControlled.jsx` — списание
- `TransferProductDialog.jsx` — перемещение

Страницы локаций подключают shared-компоненты с prop `location`.

## Связанные документы

- [recipes.md](./recipes.md) — производство списывает продукты по FIFO
- [../architecture.md](../architecture.md) — общая архитектура
