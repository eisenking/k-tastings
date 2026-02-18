"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

import { Calendar } from "@/components/ui/calendar";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

// actions
import { getRecipesByType } from "@/app/actions/recipes/getRecipesByType";
import { getRecipeGraphForFillings } from "@/app/actions/production/getRecipeGraphForFillings";
import { getProducts } from "@/app/actions/products/getProducts";
import { getProductStockMap } from "@/app/actions/production/getProductStockMap";
import { getPrepStockMap } from "@/app/actions/production/getPrepStockMap";

// -------- helpers --------
function toNum(v, fallback = 0) {
    const n = Number(String(v ?? "").replace(",", "."));
    return Number.isFinite(n) ? n : fallback;
}

function fmtG(v) {
    const n = toNum(v, 0);
    return `${Math.round(n)} г`;
}

function fmtKgFromG(v) {
    const kg = toNum(v, 0) / 1000;
    return `${kg.toFixed(2)} кг`;
}

function cx(...xs) {
    return xs.filter(Boolean).join(" ");
}

function formatRangeLabel(range) {
    if (!range?.from) return "Выбери дату";
    if (!range?.to) return format(range.from, "dd.MM.yyyy", { locale: ru });
    const a = format(range.from, "dd.MM.yyyy", { locale: ru });
    const b = format(range.to, "dd.MM.yyyy", { locale: ru });
    return a === b ? a : `${a} — ${b}`;
}

// -------- MOCK ORDERS (пока) --------
const MOCK_ORDERS = [
    { date: "2026-11-17", recipeId: "r_red_velvet", kg: 5 },
    { date: "2026-11-17", recipeId: "r_honey", kg: 2 },
    { date: "2026-11-18", recipeId: "r_red_velvet", kg: 1.5 },
];

// -------- core: PLAN A --------
// A: сначала закрываем заготовками склад2, а в продукты идёт только дефицит
function buildPlanA({
    ordersInRange,
    recipesById,
    prepStockBase,
    productStockBase,
}) {
    const needFillings = new Map();
    const needPreps = new Map();
    const usedPreps = new Map();
    const deficitPreps = new Map();

    const needProducts = new Map();
    const deficitProducts = new Map();

    function add(map, key, val) {
        map.set(key, (map.get(key) || 0) + val);
    }

    const prepStock = new Map(Object.entries(prepStockBase || {}).map(([k, v]) => [k, toNum(v, 0)]));
    const productStock = new Map(Object.entries(productStockBase || {}).map(([k, v]) => [k, toNum(v, 0)]));

    // 1) агрегируем заказы
    for (const o of ordersInRange) {
        const grams = toNum(o.kg, 0) * 1000;
        if (!o.recipeId || grams <= 0) continue;
        add(needFillings, o.recipeId, grams);
    }

    // 2) начинка -> продукты + preps
    const pendingPreps = new Map();

    for (const [fillingId, grams] of needFillings.entries()) {
        const r = recipesById.get(fillingId);
        if (!r) continue;

        const denom = toNum(r.defaultYieldBase, 0);
        if (denom <= 0) continue;

        const scale = grams / denom;

        for (const it of r.items || []) {
            const amt = toNum(it.amountBase, 0) * scale;
            if (amt <= 0) continue;

            if (it.refType === "product" && it.productId) {
                add(needProducts, it.productId, amt);
            }

            if (it.refType === "recipe" && it.childRecipeId) {
                add(pendingPreps, it.childRecipeId, amt);
            }
        }
    }

    // 3) preps рекурсивно: списать склад2, дефицит развернуть в сырьё/вложенные preps
    const queue = Array.from(pendingPreps.entries());

    while (queue.length) {
        const [prepId, gramsNeededRaw] = queue.shift();
        const gramsNeeded = toNum(gramsNeededRaw, 0);
        if (!prepId || gramsNeeded <= 0) continue;

        add(needPreps, prepId, gramsNeeded);

        const available = prepStock.get(prepId) || 0;
        const use = Math.min(available, gramsNeeded);
        const deficit = gramsNeeded - use;

        if (use > 0) {
            prepStock.set(prepId, available - use);
            add(usedPreps, prepId, use);
        }

        if (deficit > 0) {
            add(deficitPreps, prepId, deficit);

            const r = recipesById.get(prepId);
            if (!r) continue;

            const denom = toNum(r.defaultYieldBase, 0);
            if (denom <= 0) continue;

            const scale = deficit / denom;

            for (const it of r.items || []) {
                const amt = toNum(it.amountBase, 0) * scale;
                if (amt <= 0) continue;

                if (it.refType === "product" && it.productId) {
                    add(needProducts, it.productId, amt);
                }

                if (it.refType === "recipe" && it.childRecipeId) {
                    queue.push([it.childRecipeId, amt]);
                }
            }
        }
    }

    // 4) дефицит склада1
    for (const [pid, grams] of needProducts.entries()) {
        const have = productStock.get(pid) || 0;
        const def = Math.max(0, grams - have);
        if (def > 0) deficitProducts.set(pid, def);
    }

    return {
        needFillings,
        needPreps,
        usedPreps,
        deficitPreps,
        needProducts,
        deficitProducts,
    };
}

// -------- UI: DateRangePicker --------
function DateRangePicker({ value, onChange }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start gap-2 w-full sm:w-[260px]">
                    <CalendarIcon className="h-4 w-4" />
                    <span className={cx(!value?.from && "text-muted-foreground")}>
                        {formatRangeLabel(value)}
                    </span>
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-auto p-2" align="end">
                <Calendar
                    mode="range"
                    selected={value}
                    onSelect={(range) => onChange?.(range || { from: undefined, to: undefined })}
                    numberOfMonths={2}
                    locale={ru}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}

// -------- ProductionTab --------
export default function ProductionTab() {
    const [range, setRange] = useState(() => {
        const d = new Date();
        return { from: d, to: d };
    });

    const [loading, setLoading] = useState(false);

    const [products, setProducts] = useState([]);
    const [recipeGraph, setRecipeGraph] = useState({ recipes: [], items: [] });

    // ✅ реальные остатки
    const [stock1, setStock1] = useState({});
    const [stock2, setStock2] = useState({});

    async function loadAll() {
        setLoading(true);
        try {
            const [p, fillings] = await Promise.all([
                getProducts(),
                getRecipesByType("filling"),
            ]);

            const fillingsList = Array.isArray(fillings) ? fillings : [];
            const fillingIds = fillingsList.map((x) => x.id);

            const [graph, s1, s2] = await Promise.all([
                getRecipeGraphForFillings({ fillingIds }),
                getProductStockMap(),
                getPrepStockMap(),
            ]);

            setProducts(Array.isArray(p) ? p : []);
            setRecipeGraph(graph || { recipes: [], items: [] });

            setStock1(s1 || {});
            setStock2(s2 || {});
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const productNameById = useMemo(() => {
        const m = new Map();
        for (const p of products) m.set(p.id, p.name);
        return m;
    }, [products]);

    const recipesById = useMemo(() => {
        const m = new Map();

        for (const r of recipeGraph.recipes || []) {
            m.set(r.id, {
                ...r,
                defaultYieldBase: toNum(r.defaultYieldBase, 0),
                items: [],
            });
        }

        for (const it of recipeGraph.items || []) {
            const r = m.get(it.recipeId);
            if (!r) continue;
            r.items.push({
                refType: it.refType,
                productId: it.productId,
                childRecipeId: it.childRecipeId,
                amountBase: toNum(it.amountBase, 0),
            });
        }

        return m;
    }, [recipeGraph]);

    // orders in range (mock)
    const ordersInRange = useMemo(() => {
        if (!range?.from) return [];
        const from = range.from;
        const to = range.to || range.from;

        const fromTS = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
        const toTS = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999).getTime();

        return MOCK_ORDERS.filter((o) => {
            const d = new Date(o.date);
            const ts = d.getTime();
            return ts >= fromTS && ts <= toTS;
        });
    }, [range]);

    const ordersSummary = useMemo(() => {
        const m = new Map();
        for (const o of ordersInRange) {
            m.set(o.recipeId, (m.get(o.recipeId) || 0) + toNum(o.kg, 0));
        }
        return Array.from(m.entries())
            .map(([recipeId, kg]) => ({
                recipeId,
                kg,
                name: recipesById.get(recipeId)?.name || recipeId,
            }))
            .sort((a, b) => b.kg - a.kg);
    }, [ordersInRange, recipesById]);

    const plan = useMemo(() => {
        return buildPlanA({
            ordersInRange,
            recipesById,
            prepStockBase: stock2,
            productStockBase: stock1,
        });
    }, [ordersInRange, recipesById, stock1, stock2]);

    const rowsFillings = useMemo(() => {
        return Array.from(plan.needFillings.entries())
            .map(([id, grams]) => ({
                id,
                name: recipesById.get(id)?.name || id,
                grams,
            }))
            .sort((a, b) => b.grams - a.grams);
    }, [plan, recipesById]);

    const rowsPreps = useMemo(() => {
        const ids = new Set([
            ...Array.from(plan.needPreps.keys()),
            ...Array.from(plan.deficitPreps.keys()),
        ]);

        return Array.from(ids)
            .map((id) => {
                const need = plan.needPreps.get(id) || 0;
                const used = plan.usedPreps.get(id) || 0;
                const deficit = plan.deficitPreps.get(id) || 0;

                const name = recipesById.get(id)?.name || id;
                return { id, name, need, used, deficit };
            })
            .sort((a, b) => b.deficit - a.deficit);
    }, [plan, recipesById]);

    const rowsProducts = useMemo(() => {
        const ids = new Set([
            ...Array.from(plan.needProducts.keys()),
            ...Array.from(plan.deficitProducts.keys()),
        ]);

        return Array.from(ids)
            .map((id) => {
                const need = plan.needProducts.get(id) || 0;
                const have = toNum(stock1?.[id], 0);
                const deficit = plan.deficitProducts.get(id) || 0;

                const name = productNameById.get(id) || id;
                return { id, name, need, have, deficit };
            })
            .sort((a, b) => b.deficit - a.deficit);
    }, [plan, productNameById, stock1]);

    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="p-4 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-end gap-3 justify-between">
                        <div>
                            <div className="text-lg font-semibold">Производство</div>
                            <div className="text-sm text-muted-foreground">
                                Режим A: заготовки со склада 2 сначала закрывают потребность, сырьё считаем только на дефицит.
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                            <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">Период</div>
                                <DateRangePicker value={range} onChange={setRange} />
                            </div>

                            <Button
                                variant="outline"
                                className="gap-2"
                                onClick={loadAll}
                                disabled={loading}
                            >
                                <RefreshCcw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
                                Обновить
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => {
                                    const d = new Date();
                                    setRange({ from: d, to: d });
                                }}
                            >
                                Сегодня
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="font-medium">Заказано на период</div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">{formatRangeLabel(range)}</Badge>
                                {loading ? <Badge variant="secondary">загрузка…</Badge> : null}
                                <Badge variant="secondary">{`склад1: ${Object.keys(stock1).length}`}</Badge>
                                <Badge variant="secondary">{`склад2: ${Object.keys(stock2).length}`}</Badge>
                            </div>
                        </div>

                        {ordersSummary.length === 0 ? (
                            <div className="text-sm text-muted-foreground">Нет заказов (пока мок)</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {ordersSummary.map((x) => (
                                    <div key={x.recipeId} className="rounded-md border p-3 flex items-center justify-between">
                                        <div className="font-medium">{x.name}</div>
                                        <Badge variant="secondary">{`${x.kg.toFixed(2)} кг`}</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Accordion type="multiple" defaultValue={["fillings", "preps", "products"]} className="space-y-2">
                <AccordionItem value="fillings" className="border rounded-md">
                    <AccordionTrigger className="px-3 py-2">
                        <div className="flex items-center gap-2">
                            <div className="font-semibold">Нужно начинок</div>
                            <Badge variant="secondary">
                                {fmtKgFromG(rowsFillings.reduce((a, x) => a + x.grams, 0))}
                            </Badge>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-3">
                        {rowsFillings.length === 0 ? (
                            <div className="text-sm text-muted-foreground">Пусто</div>
                        ) : (
                            <div className="space-y-2">
                                {rowsFillings.map((r) => (
                                    <Row3 key={r.id} title={r.name} aLabel="нужно" a={r.grams} />
                                ))}
                            </div>
                        )}
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="preps" className="border rounded-md">
                    <AccordionTrigger className="px-3 py-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-semibold">Заготовки (склад 2)</div>
                            <Badge variant="secondary">
                                нужно: {fmtKgFromG(rowsPreps.reduce((a, x) => a + x.need, 0))}
                            </Badge>
                            <Badge variant="outline">
                                произвести: {fmtKgFromG(rowsPreps.reduce((a, x) => a + x.deficit, 0))}
                            </Badge>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-3">
                        {rowsPreps.length === 0 ? (
                            <div className="text-sm text-muted-foreground">Пусто</div>
                        ) : (
                            <div className="space-y-2">
                                {rowsPreps.map((r) => (
                                    <RowPrep
                                        key={r.id}
                                        title={r.name}
                                        need={r.need}
                                        used={r.used}
                                        deficit={r.deficit}
                                    />
                                ))}
                            </div>
                        )}
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="products" className="border rounded-md">
                    <AccordionTrigger className="px-3 py-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-semibold">Продукты (склад 1)</div>
                            <Badge variant="secondary">
                                нужно: {fmtKgFromG(rowsProducts.reduce((a, x) => a + x.need, 0))}
                            </Badge>
                            <Badge variant="outline">
                                дефицит: {fmtKgFromG(rowsProducts.reduce((a, x) => a + x.deficit, 0))}
                            </Badge>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-3">
                        {rowsProducts.length === 0 ? (
                            <div className="text-sm text-muted-foreground">Пусто</div>
                        ) : (
                            <div className="space-y-2">
                                {rowsProducts.map((r) => (
                                    <RowProduct
                                        key={r.id}
                                        title={r.name}
                                        need={r.need}
                                        have={r.have}
                                        deficit={r.deficit}
                                    />
                                ))}
                            </div>
                        )}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}

function Row3({ title, aLabel, a }) {
    return (
        <div className="rounded-md border p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="font-medium">{title}</div>
            <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">
                <Badge variant="secondary">
                    {aLabel}: {fmtG(a)}
                </Badge>
            </div>
        </div>
    );
}

function RowPrep({ title, need, used, deficit }) {
    return (
        <div className="rounded-md border p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="font-medium">{title}</div>
            <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">
                <Badge variant="secondary">нужно: {fmtG(need)}</Badge>
                <Badge variant="outline">закрыли со склада: {fmtG(used)}</Badge>
                {deficit > 0 ? (
                    <Badge variant="destructive">произвести: {fmtG(deficit)}</Badge>
                ) : (
                    <Badge variant="secondary">ок</Badge>
                )}
            </div>
        </div>
    );
}

function RowProduct({ title, need, have, deficit }) {
    return (
        <div className="rounded-md border p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="font-medium">{title}</div>
            <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">
                <Badge variant="secondary">нужно: {fmtG(need)}</Badge>
                <Badge variant="outline">есть: {fmtG(have)}</Badge>
                {deficit > 0 ? (
                    <Badge variant="destructive">не хватает: {fmtG(deficit)}</Badge>
                ) : (
                    <Badge variant="secondary">ок</Badge>
                )}
            </div>
        </div>
    );
}
