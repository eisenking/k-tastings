"use client";

import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import TastingsActionsCell from "./TastingsActionsCell.jsx";

function formatDate(d) {
    try {
        return new Date(d).toLocaleDateString("ru-RU");
    } catch {
        return "";
    }
}

function formatNum(v, digits = 0) {
    const n = Number(v);
    if (!Number.isFinite(n)) return "0";
    return n.toFixed(digits);
}

export const columns = [
    {
        accessorKey: "recipeName",
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                Название
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => <div className="font-medium">{row.original.recipeName}</div>,
    },
    {
        accessorKey: "remainingBase",
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                Остаток (г)
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        accessorFn: (row) => Number(row.remainingBase),
        cell: ({ row }) => <div className="tabular-nums">{formatNum(row.original.remainingBase, 0)}</div>,
    },
    {
        accessorKey: "producedAt",
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                Дата партии
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => <div>{formatDate(row.original.producedAt)}</div>,
    },
    {
        accessorKey: "userName",
        header: "Изготовил",
        cell: ({ row }) => <div className="text-muted-foreground">{row.original.userName ?? "—"}</div>,
    },
    	{
		id: "actions",
		cell: ({ row, table }) => (
			<TastingsActionsCell row={row.original} table={table} />
		),
	},
];