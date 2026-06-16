"use client";
import { useMemo, useState } from "react";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
} from "@tanstack/react-table";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
    ACTION_LABELS, ENTITY_LABELS, LOCATION_LABELS, ACTION_BADGE_VARIANT,
} from "./_constants";

function formatDateTime(d) {
    if (!d) return "—";
    const date = new Date(d);
    return date.toLocaleString("ru-RU", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
}

function MetadataCell({ metadata }) {
    const [open, setOpen] = useState(false);
    if (!metadata || Object.keys(metadata).length === 0) {
        return <span className="text-muted-foreground">—</span>;
    }
    return (
        <div className="max-w-xs">
            <Button
                size="sm"
                variant="ghost"
                onClick={() => setOpen((p) => !p)}
                className="h-6 px-2"
            >
                {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                <span className="ml-1 text-xs">подробности</span>
            </Button>
            {open && (
                <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-48">
                    {JSON.stringify(metadata, null, 2)}
                </pre>
            )}
        </div>
    );
}

export default function ActivityTable({ rows }) {
    const columns = useMemo(() => [
        {
            header: "Дата / время",
            accessorKey: "createdAt",
            cell: ({ row }) => (
                <span className="whitespace-nowrap text-sm">
                    {formatDateTime(row.original.createdAt)}
                </span>
            ),
        },
        {
            header: "Пользователь",
            accessorKey: "userName",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium text-sm">{row.original.userName}</span>
                    {row.original.userRole && (
                        <span className="text-xs text-muted-foreground">
                            {row.original.userRole}
                        </span>
                    )}
                </div>
            ),
        },
        {
            header: "Действие",
            accessorKey: "action",
            cell: ({ row }) => (
                <Badge variant={ACTION_BADGE_VARIANT[row.original.action] ?? "outline"}>
                    {ACTION_LABELS[row.original.action] ?? row.original.action}
                </Badge>
            ),
        },
        {
            header: "Сущность",
            accessorKey: "entity",
            cell: ({ row }) => (
                <span className="text-sm">
                    {ENTITY_LABELS[row.original.entity] ?? row.original.entity}
                </span>
            ),
        },
        {
            header: "Локация",
            accessorKey: "location",
            cell: ({ row }) =>
                row.original.location
                    ? <Badge variant="outline">{LOCATION_LABELS[row.original.location]}</Badge>
                    : <span className="text-muted-foreground">—</span>,
        },
        {
            header: "Описание",
            accessorKey: "description",
            cell: ({ row }) => (
                <span className="text-sm">{row.original.description}</span>
            ),
        },
        {
            header: "Детали",
            id: "metadata",
            cell: ({ row }) => <MetadataCell metadata={row.original.metadata} />,
        },
    ], []);

    const table = useReactTable({
        data: rows,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="rounded-md border overflow-x-auto">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((hg) => (
                        <TableRow key={hg.id}>
                            {hg.headers.map((h) => (
                                <TableHead key={h.id}>
                                    {flexRender(h.column.columnDef.header, h.getContext())}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                                Нет записей
                            </TableCell>
                        </TableRow>
                    ) : (
                        table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}