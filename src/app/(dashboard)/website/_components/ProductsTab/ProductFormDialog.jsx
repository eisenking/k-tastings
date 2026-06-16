// src/features/products/ProductFormDialog.jsx
"use client";

import { useEffect, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { productFormSchema } from "@/lib/zod/website/productsSchema";
import { createProduct, updateProduct } from "@/actions/website/products/products";

const defaultValues = {
    name: "",
    url: "",
    type: "",
    description: "",
    moreInfo: "",
    imgUrl: "",
    imgAlt: "",
    price: null,
    decorType: "",
    decorPrice: null,
    tiers: null,
    weightOnPhoto: null,
    mainCover: "",
    mainCategory: "",
    isNewProduct: false,
    sortOrder: 0,
    categoryIds: [],
    subcategoryIds: [],
};

// Отдельный компонент для подкатегорий — использует useWatch вместо form.watch
function SubcategoriesField({ control, categories, setValue, getValues }) {
    const selectedCats = useWatch({ control, name: "categoryIds" }) ?? [];

    return (
        <FormField
            control={control}
            name="subcategoryIds"
            render={({ field }) => {
                const availableSubs = categories
                    .filter((c) => selectedCats.includes(c.id))
                    .flatMap((c) =>
                        (c.subcategories ?? []).map((s) => ({
                            ...s,
                            categoryName: c.name,
                        }))
                    );

                return (
                    <FormItem>
                        <FormLabel>Подкатегории</FormLabel>
                        {availableSubs.length === 0 ? (
                            <div className="text-sm text-muted-foreground border rounded-md p-3">
                                Сначала выберите категорию с подкатегориями
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border rounded-md p-3">
                                {availableSubs.map((sub) => {
                                    const checked = field.value.includes(
                                        sub.id
                                    );
                                    return (
                                        <label
                                            key={sub.id}
                                            className="flex items-center gap-2 text-sm cursor-pointer"
                                        >
                                            <Checkbox
                                                checked={checked}
                                                onCheckedChange={(v) => {
                                                    if (v) {
                                                        field.onChange([
                                                            ...field.value,
                                                            sub.id,
                                                        ]);
                                                    } else {
                                                        field.onChange(
                                                            field.value.filter(
                                                                (id) =>
                                                                    id !==
                                                                    sub.id
                                                            )
                                                        );
                                                    }
                                                }}
                                            />
                                            <span>
                                                {sub.name}
                                                <span className="text-muted-foreground text-xs ml-1">
                                                    ({sub.categoryName})
                                                </span>
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                        <FormMessage />
                    </FormItem>
                );
            }}
        />
    );
}

export default function ProductFormDialog({
    open,
    onOpenChange,
    categories,
    product,
}) {
    const [isPending, startTransition] = useTransition();

    const form = useForm({
        resolver: zodResolver(productFormSchema),
        defaultValues,
    });

    useEffect(() => {
        if (product) {
            form.reset({
                name: product.name ?? "",
                url: product.url ?? "",
                type: product.type ?? "",
                description: product.description ?? "",
                moreInfo: product.moreInfo ?? "",
                imgUrl: product.imgUrl ?? "",
                imgAlt: product.imgAlt ?? "",
                price: product.price ? Number(product.price) : null,
                decorType: product.decorType ?? "",
                decorPrice: product.decorPrice
                    ? Number(product.decorPrice)
                    : null,
                tiers: product.tiers ?? null,
                weightOnPhoto: product.weightOnPhoto ?? null,
                mainCover: product.mainCover ?? "",
                mainCategory: product.mainCategory ?? "",
                isNewProduct: product.isNewProduct ?? false,
                sortOrder: product.sortOrder ?? 0,
                categoryIds:
                    product.categories?.map((c) => c.category.id) ?? [],
                subcategoryIds:
                    product.subcategories?.map((s) => s.subcategory.id) ?? [],
            });
        } else {
            form.reset(defaultValues);
        }
    }, [product, form, open]);

    const onSubmit = (values) => {
        startTransition(async () => {
            const res = product
                ? await updateProduct(product.id, values)
                : await createProduct(values);

            if (res.success) {
                toast.success(product ? "Товар обновлён" : "Товар создан");
                onOpenChange(false);
                form.reset(defaultValues);
            } else {
                toast.error(res.error);
                if (res.fieldErrors) {
                    Object.entries(res.fieldErrors).forEach(
                        ([field, messages]) => {
                            if (messages?.[0]) {
                                form.setError(field, {
                                    message: messages[0],
                                });
                            }
                        }
                    );
                }
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl p-0 gap-0 max-h-[90vh] grid grid-rows-[auto_1fr_auto]">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <DialogTitle>
                        {product ? "Редактировать товар" : "Новый товар"}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="contents"
                    >
                        <div className="overflow-y-auto px-6 py-4">
                            <div className="space-y-4">
                                {/* Основные поля */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Название *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="url"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    URL (slug) *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Тип</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        value={
                                                            field.value ?? ""
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="mainCategory"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Главная категория
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        value={
                                                            field.value ?? ""
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Цены */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="price"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Цена</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        {...field}
                                                        value={
                                                            field.value ?? ""
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="decorPrice"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Цена декора
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        {...field}
                                                        value={
                                                            field.value ?? ""
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="decorType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Тип декора
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        value={
                                                            field.value ?? ""
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="mainCover"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Основное покрытие
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        value={
                                                            field.value ?? ""
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Числовые поля */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="tiers"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Ярусов</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                        value={
                                                            field.value ?? ""
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="weightOnPhoto"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Вес на фото (кг)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        {...field}
                                                        value={
                                                            field.value ?? ""
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="sortOrder"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Сортировка
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Картинка */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="imgUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    URL картинки
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        value={
                                                            field.value ?? ""
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="imgAlt"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Alt картинки
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        value={
                                                            field.value ?? ""
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Текстовые поля */}
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Описание</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    rows={3}
                                                    {...field}
                                                    value={field.value ?? ""}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="moreInfo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Доп. информация
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    rows={3}
                                                    {...field}
                                                    value={field.value ?? ""}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Чекбокс "Новинка" */}
                                <FormField
                                    control={form.control}
                                    name="isNewProduct"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center gap-2 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={
                                                        field.onChange
                                                    }
                                                />
                                            </FormControl>
                                            <FormLabel className="mt-0 cursor-pointer">
                                                Новинка
                                            </FormLabel>
                                        </FormItem>
                                    )}
                                />

                                {/* Категории */}
                                <FormField
                                    control={form.control}
                                    name="categoryIds"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Категории</FormLabel>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border rounded-md p-3">
                                                {categories.length === 0 ? (
                                                    <div className="text-sm text-muted-foreground col-span-full">
                                                        Категории не найдены
                                                    </div>
                                                ) : (
                                                    categories.map((cat) => {
                                                        const checked =
                                                            field.value.includes(
                                                                cat.id
                                                            );
                                                        return (
                                                            <label
                                                                key={cat.id}
                                                                className="flex items-center gap-2 text-sm cursor-pointer"
                                                            >
                                                                <Checkbox
                                                                    checked={
                                                                        checked
                                                                    }
                                                                    onCheckedChange={(
                                                                        v
                                                                    ) => {
                                                                        if (v) {
                                                                            field.onChange(
                                                                                [
                                                                                    ...field.value,
                                                                                    cat.id,
                                                                                ]
                                                                            );
                                                                        } else {
                                                                            const subIdsToRemove =
                                                                                (
                                                                                    cat.subcategories ??
                                                                                    []
                                                                                ).map(
                                                                                    (
                                                                                        s
                                                                                    ) =>
                                                                                        s.id
                                                                                );
                                                                            form.setValue(
                                                                                "subcategoryIds",
                                                                                form
                                                                                    .getValues(
                                                                                        "subcategoryIds"
                                                                                    )
                                                                                    .filter(
                                                                                        (
                                                                                            id
                                                                                        ) =>
                                                                                            !subIdsToRemove.includes(
                                                                                                id
                                                                                            )
                                                                                    )
                                                                            );
                                                                            field.onChange(
                                                                                field.value.filter(
                                                                                    (
                                                                                        id
                                                                                    ) =>
                                                                                        id !==
                                                                                        cat.id
                                                                                )
                                                                            );
                                                                        }
                                                                    }}
                                                                />
                                                                {cat.name}
                                                            </label>
                                                        );
                                                    })
                                                )}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Подкатегории — вынесены в отдельный компонент с useWatch */}
                                <SubcategoriesField
                                    control={form.control}
                                    categories={categories}
                                    setValue={form.setValue}
                                    getValues={form.getValues}
                                />
                            </div>
                        </div>

                        <DialogFooter className="px-6 py-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isPending}
                            >
                                Отмена
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending
                                    ? "Сохранение..."
                                    : product
                                    ? "Сохранить"
                                    : "Создать"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}