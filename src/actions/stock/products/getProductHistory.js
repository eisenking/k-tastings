// "use server";
// import { and, desc, eq, gte, lte } from "drizzle-orm";
// import { db } from "@/drizzle/db";
// import {
//     ProductsTable,
//     ProductCategoriesTable,
//     StockMovementsTable,
//     ProductBatchesTable,
//     StockTransfersTable,
//     StockBalancesTable,
// } from "@/drizzle/schema";

// import { withAction } from "@/lib/utils/action-response";
// import { parseInput } from "@/lib/utils/validation";
// import { NotFoundError } from "@/lib/utils/errors";
// import { requireUser } from "@/lib/auth/session";
// import { assertCanViewLocation } from "@/lib/auth/rbac";

// import { getProductHistorySchema } from "./_shared";

// export const getProductHistory = withAction(async (input) => {
//     // 1. Auth
//     const user = await requireUser();

//     // 2. Validation
//     const data = parseInput(getProductHistorySchema, input);

//     // 3. Загружаем продукт (для проверки локации и контекста ответа)
//     const [product] = await db
//         .select({
//             id: ProductsTable.id,
//             name: ProductsTable.name,
//             location: ProductsTable.location,
//             measure: ProductsTable.measure,
//             baseUnit: ProductsTable.baseUnit,
//             pieceToBase: ProductsTable.pieceToBase,
//             categoryId: ProductsTable.categoryId,
//             categoryName: ProductCategoriesTable.name,
//             createdAt: ProductsTable.createdAt,
//         })
//         .from(ProductsTable)
//         .leftJoin(
//             ProductCategoriesTable,
//             eq(ProductsTable.categoryId, ProductCategoriesTable.id),
//         )
//         .where(eq(ProductsTable.id, data.productId))
//         .limit(1);

//     if (!product) throw new NotFoundError("Продукт не найден");

//     // 4. RBAC — pastry/cafe видят только свою локацию
//     assertCanViewLocation(user, product.location);

//     // 5. Текущий баланс
//     const [balance] = await db
//         .select({
//             totalAmount: StockBalancesTable.totalAmount,
//             avgUnitCost: StockBalancesTable.avgUnitCost,
//             lastMovementAt: StockBalancesTable.lastMovementAt,
//         })
//         .from(StockBalancesTable)
//         .where(
//             and(
//                 eq(StockBalancesTable.productId, product.id),
//                 eq(StockBalancesTable.location, product.location),
//             ),
//         )
//         .limit(1);

//    // 6. Movements — total + page (две запроса, фильтры одинаковые)
//     const whereExpr = and(...filters);

//     const [{ value: total }] = await db
//         .select({ value: count() })
//         .from(StockMovementsTable)
//         .where(whereExpr);

//     const movements = await db
//         .select({
//             id: StockMovementsTable.id,
//             type: StockMovementsTable.type,
//             location: StockMovementsTable.location,
//             reason: StockMovementsTable.reason,
//             amountBase: StockMovementsTable.amountBase,
//             cost: StockMovementsTable.cost,
//             userId: StockMovementsTable.userId,
//             userName: StockMovementsTable.userName,
//             createdAt: StockMovementsTable.createdAt,

//             batchId: StockMovementsTable.batchId,
//             batchReceivedAt: ProductBatchesTable.receivedAt,
//             batchUnitCostBase: ProductBatchesTable.unitCostBase,

//             transferId: StockMovementsTable.transferId,
//             transferFromLocation: StockTransfersTable.fromLocation,
//             transferToLocation: StockTransfersTable.toLocation,
//         })
//         .from(StockMovementsTable)
//         .leftJoin(ProductBatchesTable, eq(StockMovementsTable.batchId, ProductBatchesTable.id))
//         .leftJoin(StockTransfersTable, eq(StockMovementsTable.transferId, StockTransfersTable.id))
//         .where(whereExpr)
//         .orderBy(desc(StockMovementsTable.createdAt), desc(StockMovementsTable.id))
//         .limit(data.limit)
//         .offset(data.offset);

//     // 7. Активные партии (для отдельной вкладки «Партии»)
//     const batches = await db
//         .select({
//             id: ProductBatchesTable.id,
//             location: ProductBatchesTable.location,
//             receivedAt: ProductBatchesTable.receivedAt,
//             expirationDate: ProductBatchesTable.expirationDate,
//             receivedBase: ProductBatchesTable.receivedBase,
//             remainingBase: ProductBatchesTable.remainingBase,
//             totalCost: ProductBatchesTable.totalCost,
//             unitCostBase: ProductBatchesTable.unitCostBase,
//             sourceBatchId: ProductBatchesTable.sourceBatchId,
//             createdAt: ProductBatchesTable.createdAt,
//         })
//         .from(ProductBatchesTable)
//         .where(eq(ProductBatchesTable.productId, product.id))
//         .orderBy(desc(ProductBatchesTable.receivedAt));

//     return {
//         product,
//         balance: balance ?? { totalAmount: "0", avgUnitCost: "0", lastMovementAt: null },
//         movements,
//         batches,
//         pagination: {
//             limit: data.limit,
//             offset: data.offset,
//             total,
//             hasMore: data.offset + movements.length < total,
//         },
//     };
// });

"use server";
import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
    ProductsTable,
    ProductCategoriesTable,
    StockMovementsTable,
    ProductBatchesTable,
    StockTransfersTable,
    StockBalancesTable,
} from "@/drizzle/schema";

import { withAction } from "@/lib/utils/action-response";
import { parseInput } from "@/lib/utils/validation";
import { NotFoundError } from "@/lib/utils/errors";
import { requireUser } from "@/lib/auth/session";
import { assertCanViewLocation } from "@/lib/auth/rbac";

import { getProductHistorySchema } from "./_shared";

export const getProductHistory = withAction(async (input) => {
    // 1. Auth
    const user = await requireUser();

    // 2. Validation
    const data = parseInput(getProductHistorySchema, input);

    // 3. Продукт (для проверки локации и контекста ответа)
    const [product] = await db
        .select({
            id: ProductsTable.id,
            name: ProductsTable.name,
            location: ProductsTable.location,
            measure: ProductsTable.measure,
            baseUnit: ProductsTable.baseUnit,
            pieceToBase: ProductsTable.pieceToBase,
            categoryId: ProductsTable.categoryId,
            categoryName: ProductCategoriesTable.name,
            createdAt: ProductsTable.createdAt,
        })
        .from(ProductsTable)
        .leftJoin(
            ProductCategoriesTable,
            eq(ProductsTable.categoryId, ProductCategoriesTable.id),
        )
        .where(eq(ProductsTable.id, data.productId))
        .limit(1);

    if (!product) throw new NotFoundError("Продукт не найден");

    // 4. RBAC
    assertCanViewLocation(user, product.location);

    // 5. Текущий баланс
    const [balance] = await db
        .select({
            totalAmount: StockBalancesTable.totalAmount,
            avgUnitCost: StockBalancesTable.avgUnitCost,
            lastMovementAt: StockBalancesTable.lastMovementAt,
        })
        .from(StockBalancesTable)
        .where(
            and(
                eq(StockBalancesTable.productId, product.id),
                eq(StockBalancesTable.location, product.location),
            ),
        )
        .limit(1);

    // 6. Movements — собираем фильтры, считаем total и страницу одним where
    const filters = [eq(StockMovementsTable.productId, product.id)];
    if (data.type) filters.push(eq(StockMovementsTable.type, data.type));
    if (data.dateFrom) filters.push(gte(StockMovementsTable.createdAt, data.dateFrom));
    if (data.dateTo) filters.push(lte(StockMovementsTable.createdAt, data.dateTo));

    const whereExpr = filters.length === 1 ? filters[0] : and(...filters);

    const [{ value: total }] = await db
        .select({ value: count() })
        .from(StockMovementsTable)
        .where(whereExpr);

    const movements = await db
        .select({
            id: StockMovementsTable.id,
            type: StockMovementsTable.type,
            location: StockMovementsTable.location,
            reason: StockMovementsTable.reason,
            amountBase: StockMovementsTable.amountBase,
            cost: StockMovementsTable.cost,
            userId: StockMovementsTable.userId,
            userName: StockMovementsTable.userName,
            createdAt: StockMovementsTable.createdAt,

            batchId: StockMovementsTable.batchId,
            batchReceivedAt: ProductBatchesTable.receivedAt,
            batchUnitCostBase: ProductBatchesTable.unitCostBase,

            transferId: StockMovementsTable.transferId,
            transferFromLocation: StockTransfersTable.fromLocation,
            transferToLocation: StockTransfersTable.toLocation,
        })
        .from(StockMovementsTable)
        .leftJoin(
            ProductBatchesTable,
            eq(StockMovementsTable.batchId, ProductBatchesTable.id),
        )
        .leftJoin(
            StockTransfersTable,
            eq(StockMovementsTable.transferId, StockTransfersTable.id),
        )
        .where(whereExpr)
        .orderBy(desc(StockMovementsTable.createdAt), desc(StockMovementsTable.id))
        .limit(data.limit)
        .offset(data.offset);

    // 7. Все партии продукта (отдельная вкладка)
    const batches = await db
        .select({
            id: ProductBatchesTable.id,
            location: ProductBatchesTable.location,
            receivedAt: ProductBatchesTable.receivedAt,
            expirationDate: ProductBatchesTable.expirationDate,
            receivedBase: ProductBatchesTable.receivedBase,
            remainingBase: ProductBatchesTable.remainingBase,
            totalCost: ProductBatchesTable.totalCost,
            unitCostBase: ProductBatchesTable.unitCostBase,
            sourceBatchId: ProductBatchesTable.sourceBatchId,
            createdAt: ProductBatchesTable.createdAt,
        })
        .from(ProductBatchesTable)
        .where(eq(ProductBatchesTable.productId, product.id))
        .orderBy(desc(ProductBatchesTable.receivedAt));

    return {
        product,
        balance: balance ?? {
            totalAmount: "0",
            avgUnitCost: "0",
            lastMovementAt: null,
        },
        movements,
        batches,
        pagination: {
            limit: data.limit,
            offset: data.offset,
            total,
            hasMore: data.offset + movements.length < total,
        },
    };
}, { name: "getProductHistory" });