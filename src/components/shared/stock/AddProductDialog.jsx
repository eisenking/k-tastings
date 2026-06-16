"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon, XIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { addProduct } from "@/actions/stock/products/addProduct";
import { getProductSuggestions } from "@/actions/stock/products/getProductSuggestions";
import { unwrapActionOr } from "@/lib/utils/unwrapAction";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import {
    INPUT_UNITS,
    UNIT_LABELS,
    PRODUCT_MEASURES,
} from "@/lib/constants/units";
import {
    inferMeasureFromUnit,
    baseUnitFromMeasure,
} from "@/lib/helpers/units";
import ExpirationDatePicker from "./ExpirationDatePicker";

// ─── Локальные схемы ────────────────────────────────────────────────────────
// Пустая строка/undefined → undefined, иначе → Number
const numberFromInput = z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number({ invalid_type_error: "Должно быть число" }),
);

const optionalNumberFromInput = z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().positive("Должно быть > 0").optional(),
);

const schema = z.object({
    productId: z.string().optional(),
    name: z.string().min(1, "Введите название"),
    categoryId: z.string().min(1, "Выберите категорию"),
    inputUnit: z.enum(INPUT_UNITS),
    quantity: numberFromInput.refine((n) => n > 0, "Количество должно быть > 0"),
    totalCost: numberFromInput.refine((n) => n >= 0, "Стоимость не может быть < 0"),
    expirationDate: z.union([z.string(), z.date(), z.null()]).optional(),
    // Для штучных продуктов — masss/volume (что это "по базе")
    measure: z.enum(PRODUCT_MEASURES).optional(),
    pieceToBase: optionalNumberFromInput,
});

/**
 * Универсальный диалог "Приход на склад".
 *
 * Режимы:
 *  1) Триггерный (uncontrolled):
 *     <AddProductDialog location="pastry" categories={cats} />
 *
 *  2) Контролируемый:
 *     <AddProductDialog
 *        open={open}
 *        onOpenChange={setOpen}
 *        location="pastry"
 *        categories={cats}
 *        initialProduct={...}
 *        title="..."
 *     />
 */
export default function AddProductDialog({
    location,
    categories,

    // controlled
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    initialProduct = null,
    title = "Приход на склад",

    // uncontrolled
    triggerLabel = "Добавить",
    triggerIcon = true,
}) {
    const router = useRouter();

    const isControlled = controlledOpen !== undefined;
    const [internalOpen, setInternalOpen] = useState(false);

    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = (v) => {
        if (isControlled) controlledOnOpenChange?.(v);
        else setInternalOpen(v);
    };

    const [suggestions, setSuggestions] = useState([]);
    const pickingRef = useRef(false);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            productId: "",
            name: "",
            categoryId: "",
            inputUnit: "g",
            quantity: "",
            totalCost: "",
            expirationDate: "",
            measure: "mass",
            pieceToBase: "",
        },
    });

    const watchName = watch("name");
    const watchProductId = watch("productId");
    const inputUnit = watch("inputUnit");
    const measure = watch("measure");
    const categoryId = watch("categoryId");
    const expirationDate = watch("expirationDate");

    const isLocked = !!watchProductId;

    // Debounced версия названия — для запроса подсказок
    const debouncedName = useDebouncedValue(watchName, 250);

    const resetSelection = () => {
        setValue("productId", "");
        setSuggestions([]);
    };

    // Заполнение из initialProduct при открытии (controlled-режим)
    useEffect(() => {
        if (!open) return;
        if (!initialProduct) return;

        // initialProduct.baseUnit ожидается уже в латинице ("g"|"ml")
        const baseUnit = initialProduct.baseUnit;
        const inferredMeasure =
            initialProduct.measure ??
            (baseUnit === "ml" ? "volume" : "mass");

        setValue("productId", initialProduct.id);
        setValue("name", initialProduct.name);
        setValue("categoryId", initialProduct.categoryId ?? "");
        setValue("inputUnit", baseUnit);
        setValue("measure", inferredMeasure);
        setValue("pieceToBase", initialProduct.pieceToBase ?? "");

        setSuggestions([]);
    }, [open, initialProduct, setValue]);

    // Сброс при закрытии (только uncontrolled)
    useEffect(() => {
        if (open) return;
        if (isControlled) return;

        reset({
            productId: "",
            name: "",
            categoryId: "",
            inputUnit: "g",
            quantity: "",
            totalCost: "",
            expirationDate: "",
            measure: "mass",
            pieceToBase: "",
        });
        setSuggestions([]);
    }, [open, isControlled, reset]);

    // Подсказки по названию — на debounced-значение
    useEffect(() => {
    if (watchProductId) {
        setSuggestions([]);
        return;
    }
    if (!debouncedName || debouncedName.length < 2) {
        setSuggestions([]);
        return;
    }

    let cancelled = false;

    (async () => {
        const list = await unwrapActionOr(
            getProductSuggestions({ query: debouncedName, location }),
            [],
        );
        if (cancelled) return;
        if (pickingRef.current) return;
        setSuggestions(list);
    })();

    return () => {
        cancelled = true;
    };
}, [debouncedName, watchProductId, location]);

    // Автосинхронизация measure из единицы ввода (для не-штучных)
    useEffect(() => {
        const inferred = inferMeasureFromUnit(inputUnit);
        if (inferred) setValue("measure", inferred);
    }, [inputUnit, setValue]);

    const onSubmit = async (data) => {
        const batch = {
            qty: Number(data.quantity),
            unit: data.inputUnit,
            totalCost: Number(data.totalCost),
            expirationDate: data.expirationDate
                ? new Date(data.expirationDate)
                : null,
        };

        let payload;

        if (data.productId) {
            // Ветка 1: приход в существующий продукт
            payload = {
                productId: data.productId,
                location,
                batch,
            };
        } else {
            // Ветка 2: новый продукт + первая партия
            let productMeasure;
            let productBaseUnit;

            if (data.inputUnit === "pcs") {
                productMeasure = "piece";
                productBaseUnit = baseUnitFromMeasure(data.measure ?? "mass");
            } else {
                productMeasure = inferMeasureFromUnit(data.inputUnit);
                productBaseUnit = baseUnitFromMeasure(productMeasure);
            }

            payload = {
                name: data.name,
                categoryId: data.categoryId,
                location,
                measure: productMeasure,
                baseUnit: productBaseUnit,
                pieceToBase:
                    data.inputUnit === "pcs" ? Number(data.pieceToBase) : null,
                batch,
            };
        }

        const res = await addProduct(payload);

        if (!res.ok) {
            const firstFieldError = res.error?.fieldErrors
                ? Object.values(res.error.fieldErrors)[0]?.[0]
                : null;
            toast.error(
                firstFieldError ?? res.error?.message ?? "Ошибка добавления",
            );
            return;
        }

        toast.success(
            res.data?.isNewProduct ? "Продукт добавлен" : "Партия добавлена",
        );

        reset({
            productId: "",
            name: "",
            categoryId: "",
            inputUnit: "g",
            quantity: "",
            totalCost: "",
            expirationDate: "",
            measure: "mass",
            pieceToBase: "",
        });

        setSuggestions([]);
        setOpen(false);
        router.refresh();
    };

    const onInvalid = (errors) => {
        console.warn("Form validation errors:", errors);
        const firstError = Object.values(errors)[0];
        toast.error(firstError?.message ?? "Проверьте заполнение полей");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!isControlled && (
                <DialogTrigger asChild>
                    <Button>
                        {triggerIcon && <PlusIcon className="w-4 h-4 mr-2" />}
                        {triggerLabel}
                    </Button>
                </DialogTrigger>
            )}

            <DialogContent className="max-w-md">
                <DialogHeader className="text-center">
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription className="sr-only">
                        Форма добавления продукта или партии на склад
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit(onSubmit, onInvalid)}
                    className="space-y-4"
                >
                    {/* Название + автокомплит */}
                    <div className="relative">
                        <Input
                            {...register("name", {
                                onChange: () => {
                                    if (pickingRef.current) return;
                                    if (watchProductId) setValue("productId", "");
                                },
                            })}
                            placeholder="Название продукта"
                            autoComplete="off"
                        />

                        {isLocked && (
                            <button
                                type="button"
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted"
                                onClick={() => resetSelection()}
                                aria-label="Сбросить выбор товара"
                                title="Сбросить выбор товара"
                            >
                                <XIcon className="w-4 h-4 text-muted-foreground" />
                            </button>
                        )}

                        {suggestions.length > 0 && (
                            <div className="absolute z-10 w-full bg-background border rounded shadow mt-1 overflow-hidden">
                                {suggestions.map((p) => (
                                    <div
                                        key={p.id}
                                        className="px-3 py-2 text-sm hover:bg-muted cursor-pointer"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            pickingRef.current = true;

                                            setValue("productId", p.id);
                                            setValue("name", p.name);
                                            setValue("categoryId", p.categoryId ?? "");
                                            setValue("inputUnit", p.baseUnit);
                                            setValue("measure", p.measure);
                                            setValue("pieceToBase", p.pieceToBase ?? "");

                                            setSuggestions([]);

                                            queueMicrotask(() => {
                                                pickingRef.current = false;
                                            });
                                        }}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span>{p.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {p.category} • база:{" "}
                                                {UNIT_LABELS[p.baseUnit]}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Категория */}
                    <div>
                        <Label className="mb-1">Категория</Label>
                        <div className="flex gap-1 flex-wrap">
                            {categories.map((c) => (
                                <Button
                                    type="button"
                                    key={c.id}
                                    variant={categoryId === c.id ? "default" : "outline"}
                                    disabled={isLocked && categoryId !== c.id}
                                    onClick={() => {
                                        if (isLocked) return;
                                        setValue("categoryId", c.id);
                                    }}
                                >
                                    {c.name}
                                </Button>
                            ))}
                        </div>
                        {isLocked && (
                            <p className="text-xs text-muted-foreground mt-2">
                                Категория зафиксирована выбранным товаром.
                                Сбросьте выбор (крестик), чтобы изменить.
                            </p>
                        )}
                    </div>

                    {/* Единица ввода */}
                    <div>
                        <Label className="mb-1">Единица ввода</Label>
                        <div className="flex gap-1 flex-wrap">
                            {INPUT_UNITS.map((u) => (
                                <Button
                                    type="button"
                                    key={u}
                                    variant={inputUnit === u ? "default" : "outline"}
                                    disabled={isLocked && inputUnit !== u}
                                    onClick={() => {
                                        if (isLocked) return;
                                        setValue("inputUnit", u);
                                    }}
                                >
                                    {UNIT_LABELS[u]}
                                </Button>
                            ))}
                        </div>
                        {isLocked && (
                            <p className="text-xs text-muted-foreground mt-2">
                                Единица ввода зафиксирована выбранным товаром.
                            </p>
                        )}
                    </div>

                    {inputUnit === "pcs" && (
                        <div className="space-y-3">
                            <div>
                                <Label className="mb-1">Что это по базе?</Label>
                                <div className="flex gap-1">
                                    <Button
                                        type="button"
                                        variant={measure === "mass" ? "default" : "outline"}
                                        disabled={isLocked}
                                        onClick={() => setValue("measure", "mass")}
                                    >
                                        Масса (г)
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={measure === "volume" ? "default" : "outline"}
                                        disabled={isLocked}
                                        onClick={() => setValue("measure", "volume")}
                                    >
                                        Объём (мл)
                                    </Button>
                                </div>
                            </div>

                            <Input
                                type="number"
                                step="any"
                                {...register("pieceToBase")}
                                placeholder={`1 шт = X ${measure === "volume" ? "мл" : "г"}`}
                                disabled={isLocked}
                            />
                        </div>
                    )}

                    <Label className="mb-1">Количество</Label>
                    <Input
                        type="number"
                        step="any"
                        {...register("quantity")}
                        placeholder="Количество"
                    />

                    <Label className="mb-1">Стоимость</Label>
                    <Input
                        type="number"
                        step="any"
                        {...register("totalCost")}
                        placeholder="Стоимость партии (руб)"
                    />

                    <Label className="mb-1">Срок годности</Label>
                    <ExpirationDatePicker
                        value={expirationDate}
                        onChange={(next) =>
                            setValue("expirationDate", next, {
                                shouldValidate: true,
                                shouldDirty: true,
                            })
                        }
                        disablePast
                    />

                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? "Добавление..." : "Добавить"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}