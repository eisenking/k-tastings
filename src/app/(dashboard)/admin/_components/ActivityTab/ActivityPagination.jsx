"use client";

import { Button } from "@/components/ui/button";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { PAGE_SIZE_OPTIONS } from "./_constants";

export default function ActivityPagination({
    page, pageSize, pageCount, total,
    onPageChange, onPageSizeChange,
}) {
    const canPrev = page > 1;
    const canNext = page < pageCount;

    return (
        <div className="flex flex-col flex-wrap md:flex-row items-center justify-between gap-2 mt-2 text-sm">
            <div className="text-muted-foreground">
                Всего записей: <span className="font-medium text-foreground">{total}</span>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-muted-foreground">На странице:</span>
                <Select
                    value={String(pageSize)}
                    onValueChange={(v) => onPageSizeChange(Number(v))}
                >
                    <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {PAGE_SIZE_OPTIONS.map((s) => (
                            <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="flex items-center gap-1 ml-2">
                    <Button
                        variant="outline" size="icon" className="h-8 w-8"
                        disabled={!canPrev}
                        onClick={() => onPageChange(1)}
                    >
                        <ChevronsLeft className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="outline" size="icon" className="h-8 w-8"
                        disabled={!canPrev}
                        onClick={() => onPageChange(page - 1)}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <span className="px-2 whitespace-nowrap">
                        Стр. {page} / {Math.max(pageCount, 1)}
                    </span>

                    <Button
                        variant="outline" size="icon" className="h-8 w-8"
                        disabled={!canNext}
                        onClick={() => onPageChange(page + 1)}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="outline" size="icon" className="h-8 w-8"
                        disabled={!canNext}
                        onClick={() => onPageChange(pageCount)}
                    >
                        <ChevronsRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}