"use client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { getRecipeTreeForDetailedView } from "@/actions/recipes/getRecipeTreeForDetailedView";
import { produceRecipe } from "@/actions/recipes/produceRecipe";

function toNum(v, fallback = 0) {
    const n = Number(String(v ?? "").replace(",", "."));
    return Number.isFinite(n) ? n : fallback;
}

function formatInt(v) {
    const n = toNum(v, 0);
    return String(Math.round(n));
}

function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
}

function typeLabel(t) {
    if (t === "filling") return "Начинка";
    if (t === "preparation") return "Заготовка";
    return "Ингредиент";
}

export default function DetailedRecipe({
    open,
    onOpenChange,
    recipeId,
    location = "pastry",
    onProduced,
}) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);

    const [amountBase, setAmountBase] = useState(1000);

    useEffect(() => {
        if (!open || !recipeId) return;

        async function run() {
            setLoading(true);
            try {
                const res = await getRecipeTreeForDetailedView({ recipeId });
                if (!res?.ok) {
                    toast.error(res?.error || "Не удалось загрузить техкарту");
                    onOpenChange?.(false);
                    return;
                }

                setData(res.data);

                const base = toNum(res.data?.recipe?.defaultYieldBase, 1000);
                const min = Math.max(1000, Math.round(base || 1000));
                setAmountBase(min);
            } catch (e) {
                console.error(e);
                toast.error("Не удалось загрузить техкарту");
                onOpenChange?.(false);
            } finally {
                setLoading(false);
            }
        }

        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, recipeId]);

    const defaultYield = useMemo(() => {
        const v = toNum(data?.recipe?.defaultYieldBase, 1000);
        return v > 0 ? v : 1000;
    }, [data]);

    const sliderMax = useMemo(() => {
        return clamp(Math.max(5000, Math.round(defaultYield * 20)), 5000, 100000);
    }, [defaultYield]);

    const factor = useMemo(() => {
        return amountBase / (defaultYield || 1000);
    }, [amountBase, defaultYield]);

    const computed = useMemo(() => {
        if (!data?.items) return [];

        return data.items.map((it) => {
            const requiredBase = toNum(it.amountBase, 0) * factor;
            const availableBase = toNum(it.availableBase, 0);
            const shortageBase = Math.max(0, requiredBase - availableBase);

            let child = null;
            if (it.refType === "recipe" && it.childRecipe) {
                const childYield = toNum(it.childRecipe.defaultYieldBase, 0);
                const childFactor = childYield > 0 ? requiredBase / childYield : 0;

                const childItems = (it.childRecipe?.items || []).map((ci) => {
                    const need = toNum(ci.amountBase, 0) * childFactor;
                    const avail = toNum(ci.availableBase, 0);
                    const short = Math.max(0, need - avail);

                    return {
                        ...ci,
                        requiredBase: need,
                        availableBaseNum: avail,
                        shortageBase: short,
                        ok: short <= 0.000001,
                    };
                });

                const childOk = childItems.every((x) => x.ok);

                child = {
                    yieldBase: childYield,
                    factor: childFactor,
                    items: childItems,
                    ok: childOk,
                };
            }

            return {
                ...it,
                requiredBase,
                availableBaseNum: availableBase,
                shortageBase,
                ok: shortageBase <= 0.000001,
                child,
            };
        });
    }, [data, factor]);

    const canProduce = useMemo(() => {
        if (!data?.recipe) return false;
        if (computed.length === 0) return false;

        return computed.every((it) => {
            if (it.refType === "product") return it.ok;
            if (it.refType === "recipe") {
                if (it.ok) return true;            // есть на складе 2
                return it.child?.ok === true;      // или сможем сделать из склада 1
            }
            return false;
        });
    }, [computed, data]);

    function bump(delta) {
        setAmountBase((prev) => {
            const next = prev + delta;
            return clamp(next, 1000, sliderMax);
        });
    }

    function setPreset(v) {
        setAmountBase(clamp(v, 1000, sliderMax));
    }

    async function handleProduce() {
        if (!data?.recipe) return;

        try {
            setLoading(true);

            const res = await produceRecipe({
                recipeId: data.recipe.id,
                amountBase,
                expirationDate: null,
            });

            if (!res?.ok) {
                toast.error(res?.error || "Ошибка производства");
                return;
            }

            toast.success("Изготовлено");
            onProduced?.();
            onOpenChange?.(false);
        } catch (e) {
            console.error(e);
            toast.error(e?.message || "Ошибка производства");
        } finally {
            setLoading(false);
        }
    }

    const title = data?.recipe?.name || "Техкарта";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="
                    w-[96vw]
                    max-w-[96vw]
                    sm:max-w-3xl
                    md:max-w-5xl
                    lg:max-w-6xl
                    xl:max-w-7xl
                    p-0
                    overflow-hidden
                "
            >
                <div className="flex flex-col max-h-[90vh]">
                    <div className="p-4 sm:p-6 pb-3">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                {title}
                                {data?.recipe?.type ? (
                                    <Badge variant="secondary">{typeLabel(data.recipe.type)}</Badge>
                                ) : null}
                            </DialogTitle>
                            <DialogDescription>
                                Объём минимум 1000г. Показаны требуемые количества и доступные остатки.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="px-4 sm:px-6 pb-6 overflow-y-auto space-y-4">
                        {loading || !data ? (
                            <div className="py-10 text-center text-muted-foreground">
                                Загрузка...
                            </div>
                        ) : (
                            <>
                                <div className="rounded-md border p-4 space-y-3">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="text-sm text-muted-foreground">Объём (г)</div>
                                            <div className="text-2xl font-semibold tabular-nums">
                                                {formatInt(amountBase)}
                                            </div>
                                        </div>

                                        <div className="w-full lg:max-w-2xl">
                                            <Slider
                                                value={[amountBase]}
                                                min={1000}
                                                max={sliderMax}
                                                step={100}
                                                onValueChange={(v) => setAmountBase(clamp(v?.[0] ?? 1000, 1000, sliderMax))}
                                            />

                                            <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                                                <span>мин: 1000</span>
                                                <span>шаг: 100</span>
                                                <span>коэф: {factor.toFixed(2)}×</span>
                                            </div>

                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <Button type="button" variant="outline" size="sm" onClick={() => bump(-500)} disabled={amountBase <= 1000}>
                                                    -500
                                                </Button>
                                                <Button type="button" variant="outline" size="sm" onClick={() => bump(-100)} disabled={amountBase <= 1000}>
                                                    -100
                                                </Button>

                                                <Button type="button" variant="outline" size="sm" onClick={() => bump(100)}>
                                                    +100
                                                </Button>
                                                <Button type="button" variant="outline" size="sm" onClick={() => bump(500)}>
                                                    +500
                                                </Button>
                                                <Button type="button" variant="outline" size="sm" onClick={() => bump(1000)}>
                                                    +1000
                                                </Button>

                                                <div className="flex-1" />

                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => setPreset(1000)}
                                                >
                                                    Сброс (1000)
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                                        <div>
                                            <div className="text-muted-foreground">База рецепта</div>
                                            <div className="font-medium tabular-nums">{formatInt(defaultYield)} г</div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground">Позиции</div>
                                            <div className="font-medium">{computed.length}</div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground">Статус</div>
                                            {canProduce ? (
                                                <div className="font-medium text-green-600">Можно изготовить</div>
                                            ) : (
                                                <div className="font-medium text-red-600">Не хватает</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-md border overflow-hidden">
                                    <div className="p-3 border-b font-medium">Состав</div>

                                    <div className="divide-y">
                                        {computed.map((it) => (
                                            <RecipeRow key={it.id} item={it} />
                                        ))}

                                        {computed.length === 0 ? (
                                            <div className="p-6 text-center text-muted-foreground">
                                                В составе пока нет позиций.
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="px-4 sm:px-6 py-4 border-t flex flex-col sm:flex-row sm:justify-center gap-2 bg-background">
                        <Button onClick={handleProduce} disabled={!canProduce || loading || !data}>
                            Изготовить
                        </Button>
                        <Button variant="outline" onClick={() => onOpenChange?.(false)} disabled={loading}>
                            Закрыть
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function RecipeRow({ item }) {
    const name =
        item.refType === "product"
            ? item.product?.name || "Продукт"
            : item.childRecipe?.name || "Заготовка";

    const from = item.refType === "product" ? "Склад 1" : "Склад 2";

    const showChild = item.refType === "recipe" && item.child?.items?.length > 0;

    const statusBadge = (() => {
        if (item.refType === "product") {
            return item.ok
                ? <Badge variant="secondary">OK</Badge>
                : <Badge variant="destructive">Не хватает</Badge>;
        }

        if (item.ok) return <Badge variant="secondary">OK (есть)</Badge>;
        if (item.child?.ok) return <Badge variant="outline">OK (сделаем)</Badge>;
        return <Badge variant="destructive">Не хватает</Badge>;
    })();

    const deficitDanger = (() => {
        if (item.refType === "product") return !item.ok;
        return !item.ok && !item.child?.ok;
    })();

    return (
        <div className="p-3">
            <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-medium truncate max-w-[70vw] sm:max-w-none">{name}</div>
                            <Badge variant="outline">{from}</Badge>
                            {statusBadge}
                        </div>

                        {item.refType === "product" && item.product?.type ? (
                            <div className="text-xs text-muted-foreground mt-1">{item.product.type}</div>
                        ) : null}

                        {item.refType === "recipe" && item.child ? (
                            <div className="text-xs text-muted-foreground mt-1">
                                База заготовки: {formatInt(item.child.yieldBase)} г • коэф {item.child.factor.toFixed(2)}×
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Desktop/tablet numeric row */}
                <div className="hidden md:grid grid-cols-3 gap-3 text-sm">
                    <Metric label="Нужно (г)" value={formatInt(item.requiredBase)} />
                    <Metric label="Доступно (г)" value={formatInt(item.availableBaseNum)} />
                    <Metric label="Дефицит (г)" value={formatInt(item.shortageBase)} danger={deficitDanger} />
                </div>

                {/* Mobile numeric cards */}
                <div className="md:hidden grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    <MobileMetric label="Нужно" value={`${formatInt(item.requiredBase)} г`} />
                    <MobileMetric label="Доступно" value={`${formatInt(item.availableBaseNum)} г`} />
                    <MobileMetric label="Дефицит" value={`${formatInt(item.shortageBase)} г`} danger={deficitDanger} />
                </div>

                {/* Nested composition (accordion) */}
                {showChild ? (
                    <div className="mt-2 rounded-md border bg-muted/30 overflow-hidden">
                        <Accordion type="single" collapsible>
                            <AccordionItem value="child">
                                <AccordionTrigger className="px-3 py-2 text-sm font-medium">
                                    Показать состав «{name}» (склад 1)
                                </AccordionTrigger>
                                <AccordionContent className="p-0">
                                    <div className="divide-y">
                                        {item.child.items.map((ci) => (
                                            <NestedRow key={ci.product.id} item={ci} />
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function NestedRow({ item }) {
    const danger = !item.ok;

    return (
        <div className="px-3 py-2">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-medium truncate max-w-[70vw] sm:max-w-none">
                            {item.product.name}
                        </div>
                        {item.ok ? <Badge variant="secondary">OK</Badge> : <Badge variant="destructive">Не хватает</Badge>}
                    </div>
                    {item.product.type ? (
                        <div className="text-xs text-muted-foreground mt-1">{item.product.type}</div>
                    ) : null}
                </div>
            </div>

            <div className="hidden md:grid grid-cols-3 gap-3 text-sm mt-2">
                <Metric label="Нужно (г)" value={formatInt(item.requiredBase)} />
                <Metric label="Доступно (г)" value={formatInt(item.availableBaseNum)} />
                <Metric label="Дефицит (г)" value={formatInt(item.shortageBase)} danger={danger} />
            </div>

            <div className="md:hidden grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm mt-2">
                <MobileMetric label="Нужно" value={`${formatInt(item.requiredBase)} г`} />
                <MobileMetric label="Доступно" value={`${formatInt(item.availableBaseNum)} г`} />
                <MobileMetric label="Дефицит" value={`${formatInt(item.shortageBase)} г`} danger={danger} />
            </div>
        </div>
    );
}

function Metric({ label, value, danger = false }) {
    return (
        <div>
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className={`font-medium tabular-nums ${danger ? "text-red-600" : ""}`}>{value}</div>
        </div>
    );
}

function MobileMetric({ label, value, danger = false }) {
    return (
        <div className={`rounded-md border p-2 ${danger ? "border-red-300" : ""}`}>
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className={`font-medium tabular-nums ${danger ? "text-red-600" : ""}`}>{value}</div>
        </div>
    );
}
