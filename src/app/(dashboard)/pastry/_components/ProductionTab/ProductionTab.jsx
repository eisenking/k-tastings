"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

import { getRecipesByType } from "@/actions/recipes/getRecipesByType";
import { getRecipeGraphForFillings } from "@/actions/production/getRecipeGraphForFillings";
import { getProducts } from "@/actions/stock/products/getProducts";
import { getProductStockMap } from "@/actions/production/getProductStockMap";
import { getPrepStockMap } from "@/actions/production/getPrepStockMap";
import { getFillingStockMap } from "@/actions/production/getFillingStockMap";

import { PREP_TAB_LABELS, prepCategoryLabel } from "@/lib/helpers/recipeCategories";
import { LOCATIONS } from "@/lib/constants/roles";

import { toNum, fmtG, fmtKgFromG, formatRangeLabel, cx } from "./utils/format";

import DateRangePicker from "@/components/shared/dateRangePicker/DateRangePicker";
import PreparationsRow from "./components/PreparationsRow";
import ProductsRow from "./components/ProductsRow";
import { generateMockOrdersWeek } from "./utils/mockData";

const PREP_TABS = PREP_TAB_LABELS;
const LOCATION = LOCATIONS.PASTRY;


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

    const prepStock = new Map(
        Object.entries(prepStockBase || {}).map(([k, v]) => [k, toNum(v, 0)])
    );
    const productStock = new Map(
        Object.entries(productStockBase || {}).map(([k, v]) => [k, toNum(v, 0)])
    );

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


export default function ProductionTab() {
    const [range, setRange] = useState(() => {
        const d = new Date();
        return { from: d, to: d };
    });

    const [loading, setLoading] = useState(false);

    const [products, setProducts] = useState([]);
    const [recipeGraph, setRecipeGraph] = useState({ recipes: [], items: [] });

    // ✅ реальные остатки
    const [stock1, setStock1] = useState({}); // products
    const [stock2, setStock2] = useState({}); // preps
    const [stock3, setStock3] = useState({}); // fillings (готовые начинки)

    async function loadAll() {
        setLoading(true);
        try {
            const [productsRes, fillingsRes] = await Promise.all([
                getProducts({ location: LOCATION }),
                getRecipesByType({ location: LOCATION, type: "filling" }),
            ]);

            if (!productsRes?.ok || !fillingsRes?.ok) {
                console.error(
                    productsRes?.error || fillingsRes?.error || "Не удалось загрузить справочники",
                );
                return;
            }

            const fillingsList = Array.isArray(fillingsRes.data) ? fillingsRes.data : [];
            const fillingIds = fillingsList.map((x) => x.id);

            const [graphRes, s1Res, s2Res, s3Res] = await Promise.all([
                getRecipeGraphForFillings({ location: LOCATION, fillingIds }),
                getProductStockMap({ location: LOCATION }),
                getPrepStockMap({ location: LOCATION }),
                getFillingStockMap({ location: LOCATION }),
            ]);

            if (!graphRes?.ok || !s1Res?.ok || !s2Res?.ok || !s3Res?.ok) {
                console.error(
                    graphRes?.error ||
                        s1Res?.error ||
                        s2Res?.error ||
                        s3Res?.error ||
                        "Не удалось загрузить остатки",
                );
                return;
            }

            setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
            setRecipeGraph(graphRes.data || { recipes: [], items: [] });
            setStock1(s1Res.data || {});
            setStock2(s2Res.data || {});
            setStock3(s3Res.data || {});
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

    // ✅ мок заказов (на неделю от сегодня)
    const MOCK_ORDERS = useMemo(() => {
        return generateMockOrdersWeek(recipesById);
    }, [recipesById]);

    // orders in range (mock)
    const ordersInRange = useMemo(() => {
        if (!range?.from) return [];
        const from = range.from;
        const to = range.to || range.from;

        const fromTS = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
        const toTS = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999).getTime();

        return MOCK_ORDERS.filter((o) => {
            const ts = new Date(o.date).getTime();
            return ts >= fromTS && ts <= toTS;
        });
    }, [range, MOCK_ORDERS]);

    // ✅ “Заказано на период” + “готовые начинки” + “к производству”
    const ordersSummary = useMemo(() => {
        const orderedGByRecipe = new Map();

        for (const o of ordersInRange) {
            const grams = toNum(o.kg, 0) * 1000;
            if (!o.recipeId || grams <= 0) continue;
            orderedGByRecipe.set(o.recipeId, (orderedGByRecipe.get(o.recipeId) || 0) + grams);
        }

        const rows = Array.from(orderedGByRecipe.entries()).map(([recipeId, orderedG]) => {
            const readyG = toNum(stock3?.[recipeId], 0);
            const toProduceG = Math.max(0, orderedG - readyG);

            return {
                recipeId,
                name: recipesById.get(recipeId)?.name || recipeId,
                orderedG,
                readyG,
                toProduceG,
            };
        });

        rows.sort((a, b) => b.orderedG - a.orderedG);
        return rows;
    }, [ordersInRange, recipesById, stock3]);

    // ✅ в план считаем только дефицит по начинкам
    const planOrdersInRange = useMemo(() => {
        return ordersSummary
            .filter((x) => x.toProduceG > 0)
            .map((x) => ({
                recipeId: x.recipeId,
                kg: x.toProduceG / 1000,
            }));
    }, [ordersSummary]);

    const plan = useMemo(() => {
        return buildPlanA({
            ordersInRange: planOrdersInRange,
            recipesById,
            prepStockBase: stock2,
            productStockBase: stock1,
        });
    }, [planOrdersInRange, recipesById, stock1, stock2]);

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

                const r = recipesById.get(id);
                const name = r?.name || id;
                const category = prepCategoryLabel(r?.category) || "Прочее";

                return { id, name, category, need, used, deficit };
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

    const totalOrderedG = useMemo(() => {
        return ordersSummary.reduce((a, x) => a + x.orderedG, 0);
    }, [ordersSummary]);

    const totalReadyG = useMemo(() => {
        return ordersSummary.reduce((a, x) => a + x.readyG, 0);
    }, [ordersSummary]);

    const totalToProduceG = useMemo(() => {
        return ordersSummary.reduce((a, x) => a + x.toProduceG, 0);
    }, [ordersSummary]);

    const prepTabsData = useMemo(() => {
        const byCat = new Map();
        for (const cat of PREP_TABS) byCat.set(cat, []);

        for (const r of rowsPreps) {
            const cat = PREP_TABS.includes(r.category) ? r.category : "Прочее";
            byCat.get(cat).push(r);
        }

        const totalsByCat = new Map();
        for (const cat of PREP_TABS) {
            const rows = byCat.get(cat) || [];
            totalsByCat.set(cat, {
                need: rows.reduce((a, x) => a + x.need, 0),
                deficit: rows.reduce((a, x) => a + x.deficit, 0),
                count: rows.length,
            });
        }

        return { byCat, totalsByCat };
    }, [rowsPreps]);

    return (
        <div className="space-y-4">
            <Card className="py-0">
                <CardContent className="p-4 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-end gap-3 justify-center">
                        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                            <div className="space-y-1">
                                {/* <div className="text-xs text-muted-foreground">Период</div> */}
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
                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline">{formatRangeLabel(range)}</Badge>
                                {loading ? <Badge variant="secondary">загрузка…</Badge> : null}
                                <Badge variant="secondary">{`склад1: ${Object.keys(stock1).length}`}</Badge>
                                <Badge variant="secondary">{`склад2: ${Object.keys(stock2).length}`}</Badge>
                                <Badge variant="secondary">{`начинки: ${Object.keys(stock3).length}`}</Badge>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">заказано: {fmtKgFromG(totalOrderedG)}</Badge>
                            <Badge variant="outline">готово: {fmtKgFromG(totalReadyG)}</Badge>
                            <Badge variant="destructive">к производству: {fmtKgFromG(totalToProduceG)}</Badge>
                        </div>

                        {ordersSummary.length === 0 ? (
                            <div className="text-sm text-muted-foreground">
                                Нет заказов (мок на неделю, но выбранный период пуст)
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {ordersSummary.map((x) => (
                                    <div
                                        key={x.recipeId}
                                        className="rounded-md border p-3 space-y-2"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="font-medium">{x.name}</div>
                                            <Badge variant="secondary">{fmtKgFromG(x.orderedG)}</Badge>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant="outline">готово: {fmtKgFromG(x.readyG)}</Badge>
                                            {x.toProduceG > 0 ? (
                                                <Badge variant="destructive">к произв.: {fmtKgFromG(x.toProduceG)}</Badge>
                                            ) : (
                                                <Badge variant="secondary">ок</Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Accordion type="multiple" className="space-y-2">
                <AccordionItem value="preps" className="border rounded-md">
                    <AccordionTrigger className="px-3 py-2  justify-center">
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
                            <Tabs defaultValue={PREP_TABS[0]} className="w-full">
                                <TabsList className="mb-3 flex flex-wrap h-auto">
                                    {PREP_TABS.map((cat) => {
                                        const t = prepTabsData.totalsByCat.get(cat) || {
                                            need: 0,
                                            deficit: 0,
                                            count: 0,
                                        };

                                        return (
                                            <TabsTrigger
                                                key={cat}
                                                value={cat}
                                                className="gap-2"
                                            >
                                                {cat}
                                                {t.deficit > 0 ? (
                                                    <Badge variant="destructive" className="ml-1">
                                                        {fmtKgFromG(t.deficit)}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="ml-1">
                                                        {t.count}
                                                    </Badge>
                                                )}
                                            </TabsTrigger>
                                        );
                                    })}
                                </TabsList>

                                {PREP_TABS.map((cat) => {
                                    const rows = prepTabsData.byCat.get(cat) || [];
                                    const totalNeed = rows.reduce((a, x) => a + x.need, 0);
                                    const totalDeficit = rows.reduce((a, x) => a + x.deficit, 0);

                                    return (
                                        <TabsContent key={cat} value={cat} className="space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge variant="secondary">нужно: {fmtKgFromG(totalNeed)}</Badge>
                                                <Badge variant="outline">произвести: {fmtKgFromG(totalDeficit)}</Badge>
                                            </div>

                                            {rows.length === 0 ? (
                                                <div className="text-sm text-muted-foreground">Нет заготовок</div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {rows.map((r) => (
                                                        <PreparationsRow
                                                            key={r.id}
                                                            title={r.name}
                                                            need={r.need}
                                                            used={r.used}
                                                            deficit={r.deficit}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </TabsContent>
                                    );
                                })}
                            </Tabs>
                        )}
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="products" className="border rounded-md">
                    <AccordionTrigger className="px-3 py-2 justify-center">
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
                                    <ProductsRow
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