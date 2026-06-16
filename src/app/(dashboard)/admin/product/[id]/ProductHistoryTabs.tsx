// "use client";

// import {
//     Tabs,
//     TabsContent,
//     TabsList,
//     TabsTrigger,
// } from "@/components/ui/tabs";
// import {
//     Table,
//     TableBody,
//     TableCell,
//     TableHead,
//     TableHeader,
//     TableRow,
// } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";

// type MovementType =
//     | "Приход"
//     | "Списание"
//     | "Перемещение-Выдача"
//     | "Перемещение-Приём"
//     | "Производство";

// type Movement = {
//     id: string;
//     createdAt: Date | string;
//     type: MovementType;
//     batchId: string | null;
//     amountBase: number;
//     cost: number | null;
//     reason: string | null;
//     transferId: string | null;
// };

// type Batch = {
//     batchId: string;
//     createdAt: Date | string;
//     expirationDate: Date | string | null;
//     receivedBase: number;
//     remainingBase: number;
//     unitCostBase: number | null;
//     sourceBatchId: string | null;
// };

// type PriceRow = {
//     id: string;
//     validFrom: Date | string;
//     price: number;
// };

// type ProductHistory = {
//     product: {
//         id: string;
//         name: string;
//         location: "pastry" | "cafe";
//         baseUnit: "г" | "мл";
//     };
//     movements: Movement[];
//     batches: Batch[];
//     priceHistory: PriceRow[];
// };

// type Props = {
//     data: ProductHistory;
// };

// function formatDate(d: Date | string | null) {
//     if (!d) return "—";
//     const date = typeof d === "string" ? new Date(d) : d;
//     return new Intl.DateTimeFormat("ru-RU", {
//         year: "numeric",
//         month: "2-digit",
//         day: "2-digit",
//         hour: "2-digit",
//         minute: "2-digit",
//     }).format(date);
// }

// const format3 = (v: number) => {
//     const n = Number(v);
//     if (!Number.isFinite(n)) return "0.000";
//     return n.toFixed(3);
// };

// const formatRub = (v: number) => {
//     const n = Number(v);
//     if (!Number.isFinite(n)) return "0.00";
//     return n.toFixed(2);
// };

// function movementVariant(
//     type: MovementType
// ): "default" | "secondary" | "destructive" | "outline" {
//     switch (type) {
//         case "Приход":
//         case "Перемещение-Приём":
//             return "default";
//         case "Списание":
//         case "Производство":
//             return "destructive";
//         case "Перемещение-Выдача":
//             return "secondary";
//         default:
//             return "outline";
//     }
// }

// export default function ProductHistoryTabs({ data }: Props) {
//     const { baseUnit } = data.product;

//     return (
//         <Tabs defaultValue="movements" className="w-full">
//             <TabsList>
//                 <TabsTrigger value="movements">Движения</TabsTrigger>
//                 <TabsTrigger value="batches">Партии</TabsTrigger>
//                 <TabsTrigger value="prices">Цены</TabsTrigger>
//             </TabsList>

//             {/* MOVEMENTS */}
//             <TabsContent value="movements" className="mt-4">
//                 <div className="rounded-md border">
//                     <Table>
//                         <TableHeader>
//                             <TableRow>
//                                 <TableHead>Дата</TableHead>
//                                 <TableHead>Тип</TableHead>
//                                 <TableHead>Партия</TableHead>
//                                 <TableHead className="text-right">
//                                     Кол-во (base)
//                                 </TableHead>
//                                 <TableHead className="text-right">
//                                     Стоимость
//                                 </TableHead>
//                                 <TableHead>Причина / Перемещение</TableHead>
//                             </TableRow>
//                         </TableHeader>

//                         <TableBody>
//                             {data.movements.length === 0 ? (
//                                 <TableRow>
//                                     <TableCell
//                                         colSpan={6}
//                                         className="h-24 text-center"
//                                     >
//                                         Нет движений
//                                     </TableCell>
//                                 </TableRow>
//                             ) : (
//                                 data.movements.map((m) => (
//                                     <TableRow key={m.id}>
//                                         <TableCell className="whitespace-nowrap">
//                                             {formatDate(m.createdAt)}
//                                         </TableCell>

//                                         <TableCell>
//                                             <Badge
//                                                 variant={movementVariant(
//                                                     m.type
//                                                 )}
//                                             >
//                                                 {m.type}
//                                             </Badge>
//                                         </TableCell>

//                                         <TableCell className="whitespace-nowrap font-mono text-xs">
//                                             {m.batchId
//                                                 ? String(m.batchId).slice(0, 8)
//                                                 : "—"}
//                                         </TableCell>

//                                         <TableCell className="text-right tabular-nums">
//                                             {format3(m.amountBase)} {baseUnit}
//                                         </TableCell>

//                                         <TableCell className="text-right tabular-nums">
//                                             {m.cost != null
//                                                 ? `${formatRub(m.cost)} руб.`
//                                                 : "—"}
//                                         </TableCell>

//                                         <TableCell className="max-w-65">
//                                             <div className="truncate">
//                                                 {m.reason ?? "—"}
//                                             </div>
//                                             {m.transferId && (
//                                                 <div className="text-xs text-muted-foreground font-mono mt-0.5">
//                                                     transfer:{" "}
//                                                     {String(m.transferId).slice(
//                                                         0,
//                                                         8
//                                                     )}
//                                                 </div>
//                                             )}
//                                         </TableCell>
//                                     </TableRow>
//                                 ))
//                             )}
//                         </TableBody>
//                     </Table>
//                 </div>
//             </TabsContent>

//             {/* BATCHES */}
//             <TabsContent value="batches" className="mt-4">
//                 <div className="rounded-md border">
//                     <Table>
//                         <TableHeader>
//                             <TableRow>
//                                 <TableHead>Партия</TableHead>
//                                 <TableHead>Создана</TableHead>
//                                 <TableHead>Годен до</TableHead>
//                                 <TableHead className="text-right">
//                                     Приход (base)
//                                 </TableHead>
//                                 <TableHead className="text-right">
//                                     Остаток (base)
//                                 </TableHead>
//                                 <TableHead className="text-right">
//                                     Себестоимость
//                                 </TableHead>
//                                 <TableHead>Источник</TableHead>
//                             </TableRow>
//                         </TableHeader>

//                         <TableBody>
//                             {data.batches.length === 0 ? (
//                                 <TableRow>
//                                     <TableCell
//                                         colSpan={7}
//                                         className="h-24 text-center"
//                                     >
//                                         Партий нет
//                                     </TableCell>
//                                 </TableRow>
//                             ) : (
//                                 data.batches.map((b) => (
//                                     <TableRow key={b.batchId}>
//                                         <TableCell className="whitespace-nowrap font-mono text-xs">
//                                             {String(b.batchId).slice(0, 8)}
//                                         </TableCell>

//                                         <TableCell className="whitespace-nowrap">
//                                             {formatDate(b.createdAt)}
//                                         </TableCell>

//                                         <TableCell className="whitespace-nowrap">
//                                             {formatDate(b.expirationDate)}
//                                         </TableCell>

//                                         <TableCell className="text-right tabular-nums">
//                                             {format3(b.receivedBase)} {baseUnit}
//                                         </TableCell>

//                                         <TableCell className="text-right tabular-nums">
//                                             {format3(b.remainingBase)}{" "}
//                                             {baseUnit}
//                                         </TableCell>

//                                         <TableCell className="text-right tabular-nums">
//                                             {b.unitCostBase != null
//                                                 ? `${formatRub(
//                                                       b.unitCostBase
//                                                   )} руб./${baseUnit}`
//                                                 : "—"}
//                                         </TableCell>

//                                         <TableCell className="whitespace-nowrap font-mono text-xs">
//                                             {b.sourceBatchId ? (
//                                                 <span title="Партия пришла перемещением из другой локации">
//                                                     ↪{" "}
//                                                     {String(
//                                                         b.sourceBatchId
//                                                     ).slice(0, 8)}
//                                                 </span>
//                                             ) : (
//                                                 "—"
//                                             )}
//                                         </TableCell>
//                                     </TableRow>
//                                 ))
//                             )}
//                         </TableBody>
//                     </Table>
//                 </div>
//             </TabsContent>

//             {/* PRICES */}
//             <TabsContent value="prices" className="mt-4">
//                 <div className="rounded-md border">
//                     <Table>
//                         <TableHeader>
//                             <TableRow>
//                                 <TableHead>Дата</TableHead>
//                                 <TableHead className="text-right">
//                                     Цена
//                                 </TableHead>
//                             </TableRow>
//                         </TableHeader>

//                         <TableBody>
//                             {data.priceHistory.length === 0 ? (
//                                 <TableRow>
//                                     <TableCell
//                                         colSpan={2}
//                                         className="h-24 text-center"
//                                     >
//                                         Истории цен нет
//                                     </TableCell>
//                                 </TableRow>
//                             ) : (
//                                 data.priceHistory.map((p) => (
//                                     <TableRow key={p.id}>
//                                         <TableCell className="whitespace-nowrap">
//                                             {formatDate(p.validFrom)}
//                                         </TableCell>
//                                         <TableCell className="text-right tabular-nums">
//                                             {formatRub(p.price)} руб.
//                                         </TableCell>
//                                     </TableRow>
//                                 ))
//                             )}
//                         </TableBody>
//                     </Table>
//                 </div>
//             </TabsContent>
//         </Tabs>
//     );
// }


"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── Типы под новый ответ getProductHistory ─────────────────────────────────

type MovementType =
    | "receipt"
    | "write_off"
    | "transfer_out"
    | "transfer_in"
    | "production";

type Location = "pastry" | "cafe";

type Movement = {
    id: string;
    type: MovementType;
    location: Location;
    reason: string | null;
    amountBase: string;
    cost: string | null;
    userId: string | null;
    userName: string;
    createdAt: string;

    batchId: string | null;
    batchReceivedAt: string | null;
    batchUnitCostBase: string | null;

    transferId: string | null;
    transferFromLocation: Location | null;
    transferToLocation: Location | null;
};

type Batch = {
    id: string;
    location: Location;
    receivedAt: string;
    expirationDate: string | null;
    receivedBase: string;
    remainingBase: string;
    totalCost: string;
    unitCostBase: string;
    sourceBatchId: string | null;
    createdAt: string;
};

type ProductHistory = {
    product: {
        id: string;
        name: string;
        location: Location;
        measure: "mass" | "volume" | "piece";
        baseUnit: "g" | "ml";
        pieceToBase: string | null;
        categoryId: string;
        categoryName: string | null;
        createdAt: string;
    };
    balance: {
        totalAmount: string;
        avgUnitCost: string;
        lastMovementAt: string | null;
    };
    movements: Movement[];
    batches: Batch[];
    pagination: {
        limit: number;
        offset: number;
        total: number;
        hasMore: boolean;
    };
};

type Props = { data: ProductHistory };

// ─── Лейблы / форматтеры ────────────────────────────────────────────────────

const MOVEMENT_LABELS: Record<MovementType, string> = {
    receipt: "Приход",
    write_off: "Списание",
    transfer_out: "Перемещение — Выдача",
    transfer_in: "Перемещение — Приём",
    production: "Производство",
};

const BASE_UNIT_LABELS: Record<"g" | "ml", string> = { g: "г", ml: "мл" };

const LOCATION_LABELS: Record<Location, string> = {
    pastry: "Кондитерская",
    cafe: "Кафе",
};

function formatDate(d: string | Date | null) {
    if (!d) return "—";
    const date = typeof d === "string" ? new Date(d) : d;
    return new Intl.DateTimeFormat("ru-RU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

const toNum = (v: string | number | null | undefined) => {
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};

const format3 = (v: string | number | null | undefined) => {
    const n = toNum(v);
    return n == null ? "0.000" : n.toFixed(3);
};

const formatRub = (v: string | number | null | undefined) => {
    const n = toNum(v);
    return n == null ? "—" : `${n.toFixed(2)} ₽`;
};

function movementVariant(
    type: MovementType,
): "default" | "secondary" | "destructive" | "outline" {
    switch (type) {
        case "receipt":
        case "transfer_in":
            return "default";
        case "write_off":
        case "production":
            return "destructive";
        case "transfer_out":
            return "secondary";
        default:
            return "outline";
    }
}

// ─── Компонент ──────────────────────────────────────────────────────────────

export default function ProductHistoryTabs({ data }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const { product, balance, movements, batches, pagination } = data;
    const baseUnitLabel = BASE_UNIT_LABELS[product.baseUnit];

    function goToOffset(nextOffset: number) {
        const params = new URLSearchParams(searchParams.toString());
        if (nextOffset <= 0) params.delete("offset");
        else params.set("offset", String(nextOffset));
        router.push(`${pathname}?${params.toString()}`);
    }

    const page = Math.floor(pagination.offset / pagination.limit) + 1;
    const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));

    return (
        <div className="space-y-4">
            {/* HEADER со сводкой */}
            <div className="rounded-md border p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                    <div className="text-muted-foreground">Локация</div>
                    <div className="font-medium">
                        {LOCATION_LABELS[product.location]}
                    </div>
                </div>
                <div>
                    <div className="text-muted-foreground">Категория</div>
                    <div className="font-medium">{product.categoryName ?? "—"}</div>
                </div>
                <div>
                    <div className="text-muted-foreground">Остаток</div>
                    <div className="font-medium tabular-nums">
                        {format3(balance.totalAmount)} {baseUnitLabel}
                    </div>
                </div>
                <div>
                    <div className="text-muted-foreground">
                        Средняя себестоимость
                    </div>
                    <div className="font-medium tabular-nums">
                        {formatRub(balance.avgUnitCost)} / {baseUnitLabel}
                    </div>
                </div>
            </div>

            <Tabs defaultValue="movements" className="w-full">
                <TabsList>
                    <TabsTrigger value="movements">
                        Движения ({pagination.total})
                    </TabsTrigger>
                    <TabsTrigger value="batches">
                        Партии ({batches.length})
                    </TabsTrigger>
                </TabsList>

                {/* MOVEMENTS */}
                <TabsContent value="movements" className="mt-4 space-y-3">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Дата</TableHead>
                                    <TableHead>Тип</TableHead>
                                    <TableHead>Локация</TableHead>
                                    <TableHead>Партия</TableHead>
                                    <TableHead className="text-right">
                                        Кол-во
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Стоимость
                                    </TableHead>
                                    <TableHead>Пользователь</TableHead>
                                    <TableHead>Причина / Перемещение</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {movements.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={8}
                                            className="h-24 text-center"
                                        >
                                            Нет движений
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    movements.map((m) => (
                                        <TableRow key={m.id}>
                                            <TableCell className="whitespace-nowrap">
                                                {formatDate(m.createdAt)}
                                            </TableCell>

                                            <TableCell>
                                                <Badge variant={movementVariant(m.type)}>
                                                    {MOVEMENT_LABELS[m.type]}
                                                </Badge>
                                            </TableCell>

                                            <TableCell>
                                                {LOCATION_LABELS[m.location]}
                                            </TableCell>

                                            <TableCell className="whitespace-nowrap font-mono text-xs">
                                                {m.batchId
                                                    ? m.batchId.slice(0, 8)
                                                    : "—"}
                                            </TableCell>

                                            <TableCell className="text-right tabular-nums">
                                                {format3(m.amountBase)} {baseUnitLabel}
                                            </TableCell>

                                            <TableCell className="text-right tabular-nums">
                                                {formatRub(m.cost)}
                                            </TableCell>

                                            <TableCell className="whitespace-nowrap">
                                                {m.userName}
                                            </TableCell>

                                            <TableCell className="max-w-[260px]">
                                                <div className="truncate">
                                                    {m.reason ?? "—"}
                                                </div>
                                                {m.transferId && (
                                                    <div className="text-xs text-muted-foreground font-mono mt-0.5">
                                                        {m.transferFromLocation &&
                                                            m.transferToLocation && (
                                                                <span className="mr-1">
                                                                    {LOCATION_LABELS[m.transferFromLocation]}{" "}
                                                                    →{" "}
                                                                    {LOCATION_LABELS[m.transferToLocation]}
                                                                </span>
                                                            )}
                                                        <span>
                                                            #{m.transferId.slice(0, 8)}
                                                        </span>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Пагинация */}
                    {pagination.total > pagination.limit && (
                        <div className="flex items-center justify-between text-sm">
                            <div className="text-muted-foreground">
                                Страница {page} из {totalPages} · всего{" "}
                                {pagination.total}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        goToOffset(
                                            Math.max(
                                                0,
                                                pagination.offset - pagination.limit,
                                            ),
                                        )
                                    }
                                    disabled={pagination.offset <= 0}
                                >
                                    Назад
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        goToOffset(pagination.offset + pagination.limit)
                                    }
                                    disabled={!pagination.hasMore}
                                >
                                    Вперёд
                                </Button>
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* BATCHES */}
                <TabsContent value="batches" className="mt-4">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Партия</TableHead>
                                    <TableHead>Получена</TableHead>
                                    <TableHead>Годен до</TableHead>
                                    <TableHead>Локация</TableHead>
                                    <TableHead className="text-right">
                                        Приход
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Остаток
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Сумма
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Себестоимость
                                    </TableHead>
                                    <TableHead>Источник</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {batches.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={9}
                                            className="h-24 text-center"
                                        >
                                            Партий нет
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    batches.map((b) => {
                                        const isDepleted =
                                            toNum(b.remainingBase) === 0;
                                        return (
                                            <TableRow
                                                key={b.id}
                                                className={
                                                    isDepleted
                                                        ? "text-muted-foreground"
                                                        : ""
                                                }
                                            >
                                                <TableCell className="whitespace-nowrap font-mono text-xs">
                                                    {b.id.slice(0, 8)}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    {formatDate(b.receivedAt)}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    {formatDate(b.expirationDate)}
                                                </TableCell>
                                                <TableCell>
                                                    {LOCATION_LABELS[b.location]}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {format3(b.receivedBase)}{" "}
                                                    {baseUnitLabel}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {format3(b.remainingBase)}{" "}
                                                    {baseUnitLabel}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {formatRub(b.totalCost)}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {formatRub(b.unitCostBase)} /{" "}
                                                    {baseUnitLabel}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap font-mono text-xs">
                                                    {b.sourceBatchId ? (
                                                        <span title="Партия пришла перемещением">
                                                            ↪ {b.sourceBatchId.slice(0, 8)}
                                                        </span>
                                                    ) : (
                                                        "—"
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}