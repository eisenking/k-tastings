"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from "@/components/ui/tooltip";
import { ArrowUpDown } from "lucide-react";
import ProductActionsCell from "./ProductActionsCell";

export type Products = {
    id: string;
    name: string;
    location: "pastry" | "cafe";
    category: string;
    categoryId: string | null;
    baseUnit: "г" | "мл";
    measure: "mass" | "volume";
    pieceToBase: number | null;

    totalBaseQuantity: number;
    totalValue: number;

    priceBreakdown: {
        batchId: string;
        receivedAt: Date;
        expirationDate: Date | null;
        remainingBase: number;
        unitCostBase: number | null;
        batchValue: number | null;
    }[];
};

function formatRub(v: unknown) {
    const n = Number(v);
    if (!Number.isFinite(n)) return "0.00";
    return n.toFixed(2);
}

function formatQty(v: unknown) {
    const n = Number(v);
    if (!Number.isFinite(n)) return "0";
    if (Math.abs(n) >= 100) return n.toFixed(0);
    if (Math.abs(n) >= 10) return n.toFixed(1);
    return n.toFixed(2);
}

function formatDate(d: unknown) {
    if (!d) return "";
    try {
        return new Date(d as any).toLocaleDateString("ru-RU");
    } catch {
        return "";
    }
}

function bigUnit(baseUnit: Products["baseUnit"]) {
    return baseUnit === "г" ? "кг" : "л";
}

function formatUnitCostKgL(
    unitCostBase: number | null,
    baseUnit: Products["baseUnit"]
) {
    if (unitCostBase == null) return "—";
    const perKgL = Number(unitCostBase) * 1000;
    return `${formatRub(perKgL)} руб./${bigUnit(baseUnit)}`;
}

export const columns: ColumnDef<Products>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                }
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "name",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                }
            >
                Название
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
    },
    {
        accessorKey: "category",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                }
            >
                Категория
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        filterFn: (row, id, value) => {
            if (!value || value.length === 0) return true;
            return value.includes(row.getValue(id));
        },
    },
    {
        id: "quantity",
        accessorFn: (row) => Number(row.totalBaseQuantity),
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                }
            >
                Количество
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const { totalBaseQuantity, baseUnit, priceBreakdown } =
                row.original;

            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex flex-col">
                                <span className="tabular-nums">
                                    {formatQty(totalBaseQuantity)} {baseUnit}
                                </span>
                            </div>
                        </TooltipTrigger>

                        <TooltipContent className="w-[320px]">
                            <div className="space-y-2">
                                {!priceBreakdown ||
                                priceBreakdown.length === 0 ? (
                                    <div className="text-sm text-muted-foreground">
                                        Нет данных по партиям
                                    </div>
                                ) : (
                                    <>
                                        {priceBreakdown.map((b) => (
                                            <div
                                                key={b.batchId}
                                                className="space-y-1"
                                            >
                                                <div className="flex justify-between gap-2">
                                                    <span className="text-sm font-medium">
                                                        Партия{" "}
                                                        {formatDate(
                                                            b.receivedAt
                                                        )}
                                                    </span>
                                                    <span className="text-sm tabular-nums">
                                                        {formatQty(
                                                            b.remainingBase
                                                        )}{" "}
                                                        {baseUnit}
                                                    </span>
                                                </div>

                                                <div className="text-xs text-muted-foreground flex justify-between gap-2">
                                                    <span>
                                                        {b.expirationDate
                                                            ? `годен до ${formatDate(
                                                                  b.expirationDate
                                                              )}`
                                                            : "без срока"}
                                                    </span>
                                                    <span className="tabular-nums">
                                                        {formatUnitCostKgL(
                                                            b.unitCostBase,
                                                            baseUnit
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="border-t pt-2 flex justify-between font-semibold">
                                            <span>Итого</span>
                                            <span className="tabular-nums">
                                                {formatQty(totalBaseQuantity)}{" "}
                                                {baseUnit}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        },
    },
    {
        id: "totalValue",
        accessorFn: (row) => Number(row.totalValue),
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                }
            >
                Цена
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const { totalValue, priceBreakdown, baseUnit } = row.original;

            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex flex-col">
                                <span className="tabular-nums">
                                    {formatRub(totalValue)} руб.
                                </span>
                            </div>
                        </TooltipTrigger>

                        <TooltipContent className="w-85">
                            <div className="space-y-2">
                                {!priceBreakdown ||
                                priceBreakdown.length === 0 ? (
                                    <div className="text-sm text-muted-foreground">
                                        Нет данных по партиям
                                    </div>
                                ) : (
                                    <>
                                        {priceBreakdown.map((b) => (
                                            <div
                                                key={b.batchId}
                                                className="space-y-1"
                                            >
                                                <div className="flex justify-between gap-2">
                                                    <span className="font-medium">
                                                        Партия{" "}
                                                        {formatDate(
                                                            b.receivedAt
                                                        )}
                                                    </span>
                                                    <span className="tabular-nums">
                                                        {b.batchValue != null
                                                            ? `${formatRub(
                                                                  b.batchValue
                                                              )} руб.`
                                                            : "—"}
                                                    </span>
                                                </div>

                                                <div className="text-xs text-muted-foreground flex justify-between gap-2">
                                                    <span>
                                                        {b.expirationDate
                                                            ? `годен до ${formatDate(
                                                                  b.expirationDate
                                                              )}`
                                                            : "без срока"}
                                                    </span>
                                                    <span className="tabular-nums">
                                                        {formatUnitCostKgL(
                                                            b.unitCostBase,
                                                            baseUnit
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="border-t pt-2 flex justify-between font-semibold">
                                            <span>Итого</span>
                                            <span className="tabular-nums">
                                                {formatRub(totalValue)} руб.
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        },
    },
    {
        id: "actions",
        cell: ({ row, table }) => (
            <ProductActionsCell row={row.original} table={table} />
        ),
    },
];