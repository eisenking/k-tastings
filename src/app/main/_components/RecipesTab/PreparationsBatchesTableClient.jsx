"use client";

import { useMemo, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getPreparationsBatches } from "@/app/actions/recipes/getPreparationsBatches";

export default function PreparationsBatchesTableClient({ initialRows }) {
    const [rows, setRows] = useState(initialRows || []);
    const [q, setQ] = useState("");
    const [isPending, startTransition] = useTransition();

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return rows;
        return rows.filter((r) => String(r.recipeName).toLowerCase().includes(s));
    }, [q, rows]);

    function refresh() {
        startTransition(async () => {
            try {
                const data = await getPreparationsBatches({ q });
                setRows(data);
            } catch {
                toast.error("Не удалось обновить заготовки");
            }
        });
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <div className="text-lg font-semibold">Заготовки — партии (FIFO)</div>
                    <div className="text-sm text-muted-foreground">
                        Старые партии сверху (FIFO). Единица: граммы.
                    </div>
                </div>

                <div className="flex gap-2">
                    <Input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Поиск по названию..."
                        className="w-[260px]"
                    />
                    <Button variant="outline" onClick={refresh} disabled={isPending}>
                        {isPending ? "..." : "Обновить"}
                    </Button>
                </div>
            </div>

            <div className="rounded-md border overflow-hidden">
                <div className="grid grid-cols-[1.4fr_140px_120px_120px_160px_160px] gap-2 p-3 text-sm font-medium border-b">
                    <div>Техкарта</div>
                    <div>Тип</div>
                    <div>Остаток</div>
                    <div>Выход</div>
                    <div>Себест. (руб/г)</div>
                    <div>Дата</div>
                </div>

                {filtered.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">Нет остатков</div>
                ) : (
                    filtered.map((r) => (
                        <div
                            key={r.id}
                            className="grid grid-cols-[1.4fr_140px_120px_120px_160px_160px] gap-2 p-3 text-sm border-b last:border-b-0 items-center"
                        >
                            <div className="min-w-0">
                                <div className="font-medium truncate">{r.recipeName}</div>
                                <div className="text-xs text-muted-foreground">
                                    партия: {String(r.id).slice(0, 8)}
                                </div>
                            </div>

                            <div>
                                <Badge variant="secondary">{r.recipeType}</Badge>
                            </div>

                            <div>{Number(r.remainingBase).toFixed(1)} г</div>

                            <div className="text-muted-foreground">
                                {Number(r.producedBase).toFixed(1)} г
                            </div>

                            <div className="text-muted-foreground">
                                {r.unitCostBase != null ? Number(r.unitCostBase).toFixed(4) : "—"}
                            </div>

                            <div className="text-muted-foreground">
                                {r.producedAt ? new Date(r.producedAt).toLocaleString() : "—"}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}