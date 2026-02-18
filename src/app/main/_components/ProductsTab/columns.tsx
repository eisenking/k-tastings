"use client"
import { useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
	Tooltip, 
	TooltipContent, 
	TooltipTrigger,
	TooltipProvider 
} from "@/components/ui/tooltip";
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import Link from "next/link"
import WriteOffDialogControlled from "./WriteOffDialogControlled";
import ProductActionsCell from "./ProductActionCell";

export type Products = {
	id: string;
	name: string;
	type: string;
	baseUnit: string;
	totalBaseQuantity: number;
	totalWeight: number;
	price: number;
	totalValue: number;
	breakdown: {
		variantId: string;
		variantName: string;
		unit: string;
		quantity: number;
		quantityBase: number;
	}[];
	 priceBreakdown: {
        batchId: string;
        receivedAt: Date;
        expirationDate: Date | null;

        variantId: string;
        variantName: string;
        unit: string;

        remainingBase: number;

        purchasePrice: number | null;
        unitCostBase: number | null;
        batchValue: number | null;
    }[];
};


export const columns: ColumnDef<Products>[] = [
	{
		id: "select",
		header: ({ table }) => (
			<Checkbox
			checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
			onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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
		header: ({ column }) => {
			return (
			<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
				Название
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
			)
		},
	},
	{
		accessorKey: "type",
		header: ({ column }) => {
			return (
			<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
				Тип
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
			)
		},
		filterFn: (row, id, value) => {
			if (!value || value.length === 0) return true
			return value.includes(row.getValue(id))
		},
	},
	{
		accessorKey: "quantity",
		header: ({ column, table }) => {
		return (
			<div className="flex flex-col space-y-2">
			<Button 
				variant="ghost" 
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				className=""
			>
				Количество
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
			</div>
		)
	},
	cell: ({ row }) => {
	const { breakdown, totalBaseQuantity, baseUnit} = row.original;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div className="flex flex-col">
					<span>{totalBaseQuantity} {baseUnit}</span>
				</div>
			</TooltipTrigger>
			<TooltipContent>
				<div className="space-y-1">
                    {breakdown.map((b) => (
                        <div key={b.variantId} className="flex justify-between gap-2">
                            <span>
                                {b.variantName}:
                            </span>
                            <span>
                                {b.quantity} {b.unit}
                            </span>
                        </div>
                    ))}

                    <div className="border-t pt-1 font-semibold">
                        Итого: {totalBaseQuantity} {baseUnit}
                    </div>
                </div>
			</TooltipContent>
		</Tooltip>
	);
	},
		filterFn: (row, id, value) => {
		// Фильтрация по общему весу
		const totalWeight = row.original.totalWeight;
		if (!value) return true;
			return String(totalWeight).includes(value);
		},
	},
	{
    accessorKey: "totalValue",
    header: ({ column }) => {
        return (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Цена
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        );
    },
    accessorFn: (row) => Number(row.totalValue),
    cell: ({ row }) => {
        const { totalValue, priceBreakdown, baseUnit } = row.original;

        const formatRub = (v) => {
            const n = Number(v);
            if (!Number.isFinite(n)) return "0";
            return n.toFixed(2);
        };

        const formatDate = (d) => {
            try {
                return new Date(d).toLocaleDateString("ru-RU");
            } catch {
                return "";
            }
        };

        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex flex-col">
                            <span>{formatRub(totalValue)} руб.</span>
                        </div>
                    </TooltipTrigger>

                    <TooltipContent className="w-[320px]">
                        <div className="space-y-2">
                            {priceBreakdown.length === 0 ? (
                                <div className="text-sm text-muted-foreground">
                                    Нет данных по партиям
                                </div>
                            ) : (
                                <>
                                    {priceBreakdown.map((b) => (
                                        <div key={b.batchId} className="space-y-1">
                                            <div className="flex justify-between gap-2">
                                                <span className="font-medium">
                                                    {b.variantName}
                                                </span>
                                                <span className="tabular-nums">
                                                    {b.batchValue !== null ? `${formatRub(b.batchValue)} руб.` : "—"}
                                                </span>
                                            </div>

                                            <div className="text-xs text-muted-foreground flex justify-between gap-2">
                                                <span>
                                                    Партия: {formatDate(b.receivedAt)}
                                                    {b.expirationDate ? ` • годен до ${formatDate(b.expirationDate)}` : ""}
                                                </span>
                                                <span className="tabular-nums">
                                                    {b.unitCostBase !== null ? `${formatRub(b.unitCostBase)} руб./${baseUnit}` : "—"}
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
		cell: ({ row }) => <ProductActionsCell row={row.original} />,
	},
]