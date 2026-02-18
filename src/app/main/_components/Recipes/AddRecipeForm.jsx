// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { useForm, useFieldArray, Controller } from "react-hook-form";
// import { toast } from "sonner";

// import {
//     Dialog,
//     DialogHeader,
//     DialogTitle,
//     DialogDescription,
//     DialogContent,
//     DialogTrigger,
// } from "@/components/ui/dialog";

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";

// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from "@/components/ui/select";

// import { PlusIcon, Trash2 } from "lucide-react";

// import { getProducts } from "@/app/actions/products/getProducts";
// import { createRecipe } from "@/app/actions/recipes/createRecipe";

// const PREP_CATEGORIES = ["Крема", "Бисквиты", "Промочки", "Прочее"];

// function toNum(v, fallback = 0) {
//     const n = Number(String(v ?? "").replace(",", "."));
//     return Number.isFinite(n) ? n : fallback;
// }

// export default function AddRecipeForm({ onCreated, defaultRecipeType = "filling" }) {
//     const [open, setOpen] = useState(false);
//     const [products, setProducts] = useState([]);
//     const [loadingProducts, setLoadingProducts] = useState(false);

//     const form = useForm({
//         defaultValues: {
//             name: "",
//             type: defaultRecipeType, // filling / preparation / ingredient
//             defaultYieldBase: 1000,
//             steps: "",
//             note: "",
//             simpleItems: [],
//             complexGroups: [],
//         },
//     });

//     const { control, register, handleSubmit, watch, reset, setValue } = form;
//     const recipeType = watch("type");

//     const simpleFA = useFieldArray({ control, name: "simpleItems" });
//     const groupsFA = useFieldArray({ control, name: "complexGroups" });

//     useEffect(() => {
//         async function fetchProducts() {
//             setLoadingProducts(true);
//             try {
//                 const data = await getProducts();
//                 setProducts(Array.isArray(data) ? data : []);
//             } catch (e) {
//                 console.error(e);
//                 toast.error("Не удалось загрузить продукты");
//             } finally {
//                 setLoadingProducts(false);
//             }
//         }
//         fetchProducts();
//     }, []);

//     const productsByType = useMemo(() => {
//         const map = new Map();
//         for (const p of products) {
//             const t = p.type || "—";
//             if (!map.has(t)) map.set(t, []);
//             map.get(t).push(p);
//         }
//         return map;
//     }, [products]);

//     function ProductPicker({ value, onChange }) {
//         const [typeFilter, setTypeFilter] = useState("");

//         const types = useMemo(() => {
//             return Array.from(productsByType.keys()).filter(Boolean);
//         }, [productsByType]);

//         const list = useMemo(() => {
//             if (!typeFilter) return products;
//             return productsByType.get(typeFilter) || [];
//         }, [typeFilter, products, productsByType]);

//         return (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
//                 <div>
//                     <Label className="text-xs text-muted-foreground">Тип</Label>
//                     <Select value={typeFilter} onValueChange={setTypeFilter}>
//                         <SelectTrigger>
//                             <SelectValue placeholder="Выбери тип" />
//                         </SelectTrigger>
//                         <SelectContent>
//                             {types.map((t) => (
//                                 <SelectItem key={t} value={t}>
//                                     {t}
//                                 </SelectItem>
//                             ))}
//                         </SelectContent>
//                     </Select>
//                 </div>

//                 <div>
//                     <Label className="text-xs text-muted-foreground">Ингредиент</Label>
//                     <Select value={value || ""} onValueChange={onChange}>
//                         <SelectTrigger>
//                             <SelectValue placeholder={loadingProducts ? "Загрузка..." : "Выбери продукт"} />
//                         </SelectTrigger>
//                         <SelectContent>
//                             {list.map((p) => (
//                                 <SelectItem key={p.id} value={p.id}>
//                                     {p.name}
//                                 </SelectItem>
//                             ))}
//                         </SelectContent>
//                     </Select>
//                 </div>
//             </div>
//         );
//     }

//     async function onSubmit(values) {
//         try {
//             if (!values.name?.trim()) {
//                 toast.error("Название обязательно");
//                 return;
//             }

//             const payload = {
//                 ...values,
//                 defaultYieldBase: toNum(values.defaultYieldBase, 1000),
//                 simpleItems: (values.simpleItems || []).map((x) => ({
//                     productId: x.productId || null,
//                     amountBase: toNum(x.amountBase, 0),
//                 })),
//                 complexGroups: (values.complexGroups || []).map((g) => ({
//                     name: (g.name || "").trim(),
//                     category: g.category || null,
//                     items: (g.items || []).map((it) => ({
//                         productId: it.productId || null,
//                         amountBase: toNum(it.amountBase, 0),
//                     })),
//                 })),
//             };

//             await createRecipe(payload);
//             toast.success("Техкарта создана");

//             setOpen(false);
//             reset({
//                 name: "",
//                 type: defaultRecipeType,
//                 defaultYieldBase: 1000,
//                 steps: "",
//                 note: "",
//                 simpleItems: [],
//                 complexGroups: [],
//             });

//             onCreated?.();
//         } catch (e) {
//             console.error(e);
//             toast.error("Ошибка создания техкарты");
//         }
//     }

//     return (
//         <Dialog open={open} onOpenChange={setOpen}>
//             <DialogTrigger asChild>
//                 <Button className="gap-2">
//                     <PlusIcon className="h-4 w-4" />
//                     Добавить техкарту
//                 </Button>
//             </DialogTrigger>

//             <DialogContent className="max-w-3xl">
//                 <DialogHeader>
//                     <DialogTitle>Новая техкарта</DialogTitle>
//                     <DialogDescription>
//                         Начинка может содержать сложные ингредиенты (крем/бисквит), которые будут созданы как отдельные заготовки.
//                     </DialogDescription>
//                 </DialogHeader>

//                 <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                         <div className="space-y-1">
//                             <Label>Название</Label>
//                             <Input {...register("name")} placeholder="Красный бархат" />
//                         </div>

//                         <div className="space-y-1">
//                             <Label>Тип</Label>
//                             <Controller
//                                 control={control}
//                                 name="type"
//                                 render={({ field }) => (
//                                     <Select value={field.value} onValueChange={field.onChange}>
//                                         <SelectTrigger>
//                                             <SelectValue placeholder="Выбери тип" />
//                                         </SelectTrigger>
//                                         <SelectContent>
//                                             <SelectItem value="filling">Начинка</SelectItem>
//                                             <SelectItem value="preparation">Заготовка</SelectItem>
//                                             <SelectItem value="ingredient">Ингредиент</SelectItem>
//                                         </SelectContent>
//                                     </Select>
//                                 )}
//                             />
//                         </div>

//                         <div className="space-y-1">
//                             <Label>Необходимый вес (г)</Label>
//                             <Input
//                                 type="number"
//                                 inputMode="decimal"
//                                 {...register("defaultYieldBase")}
//                                 placeholder="1000"
//                             />
//                         </div>
//                     </div>

//                     {/* Сложные ингредиенты (подрецепты) — актуально в основном для начинки */}
//                     <div className="rounded-md border p-3 space-y-3">
//                         <div className="flex items-center justify-between gap-2">
//                             <div>
//                                 <div className="font-semibold">Сложные ингредиенты</div>
//                                 <div className="text-sm text-muted-foreground">
//                                     Крем/бисквит и т.п. будут созданы как отдельные заготовки (preparation).
//                                 </div>
//                             </div>

//                             <Button
//                                 type="button"
//                                 variant="outline"
//                                 onClick={() => groupsFA.append({ name: "", category: "Крема", items: [] })}
//                             >
//                                 + Добавить
//                             </Button>
//                         </div>

//                         {groupsFA.fields.length === 0 ? (
//                             <div className="text-sm text-muted-foreground">Нет сложных ингредиентов</div>
//                         ) : (
//                             <div className="space-y-3">
//                                 {groupsFA.fields.map((g, gi) => (
//                                     <ComplexGroup
//                                         key={g.id}
//                                         control={control}
//                                         register={register}
//                                         index={gi}
//                                         remove={() => groupsFA.remove(gi)}
//                                         ProductPicker={ProductPicker}
//                                     />
//                                 ))}
//                             </div>
//                         )}
//                     </div>

//                     {/* Простые ингредиенты */}
//                     <div className="rounded-md border p-3 space-y-3">
//                         <div className="flex items-center justify-between gap-2">
//                             <div>
//                                 <div className="font-semibold">Простые ингредиенты</div>
//                                 <div className="text-sm text-muted-foreground">
//                                     Прямые продукты со склада 1.
//                                 </div>
//                             </div>

//                             <Button
//                                 type="button"
//                                 variant="outline"
//                                 onClick={() => simpleFA.append({ productId: "", amountBase: "" })}
//                             >
//                                 + Добавить
//                             </Button>
//                         </div>

//                         {simpleFA.fields.length === 0 ? (
//                             <div className="text-sm text-muted-foreground">Нет простых ингредиентов</div>
//                         ) : (
//                             <div className="space-y-2">
//                                 {simpleFA.fields.map((f, i) => (
//                                     <div key={f.id} className="rounded-md border p-3">
//                                         <div className="flex items-start justify-between gap-2">
//                                             <div className="w-full space-y-2">
//                                                 <Controller
//                                                     control={control}
//                                                     name={`simpleItems.${i}.productId`}
//                                                     render={({ field }) => (
//                                                         <ProductPicker value={field.value} onChange={field.onChange} />
//                                                     )}
//                                                 />

//                                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
//                                                     <div className="space-y-1">
//                                                         <Label className="text-xs text-muted-foreground">Количество (г)</Label>
//                                                         <Input
//                                                             type="number"
//                                                             inputMode="decimal"
//                                                             {...register(`simpleItems.${i}.amountBase`)}
//                                                             placeholder="например 120"
//                                                         />
//                                                     </div>
//                                                 </div>
//                                             </div>

//                                             <Button type="button" variant="ghost" onClick={() => simpleFA.remove(i)}>
//                                                 <Trash2 className="h-4 w-4" />
//                                             </Button>
//                                         </div>
//                                     </div>
//                                 ))}
//                             </div>
//                         )}
//                     </div>

//                     <div className="grid grid-cols-1 gap-3">
//                         <div className="space-y-1">
//                             <Label>Шаги/описание</Label>
//                             <Input {...register("steps")} placeholder="Краткое описание..." />
//                         </div>
//                         <div className="space-y-1">
//                             <Label>Заметка</Label>
//                             <Input {...register("note")} placeholder="Примечание..." />
//                         </div>
//                     </div>

//                     <div className="flex justify-end gap-2">
//                         <Button type="button" variant="outline" onClick={() => setOpen(false)}>
//                             Отмена
//                         </Button>
//                         <Button type="submit">
//                             Создать
//                         </Button>
//                     </div>
//                 </form>
//             </DialogContent>
//         </Dialog>
//     );
// }

// function ComplexGroup({ control, register, index, remove, ProductPicker }) {
//     const itemsFA = useFieldArray({
//         control,
//         name: `complexGroups.${index}.items`,
//     });

//     return (
//         <div className="rounded-md border p-3 space-y-3">
//             <div className="flex items-start justify-between gap-2">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
//                     <div className="space-y-1">
//                         <Label>Название (например Крем)</Label>
//                         <Input {...register(`complexGroups.${index}.name`)} placeholder="Крем" />
//                     </div>

//                     <div className="space-y-1">
//                         <Label>Категория</Label>
//                         <Controller
//                             control={control}
//                             name={`complexGroups.${index}.category`}
//                             render={({ field }) => (
//                                 <Select value={field.value || "Крема"} onValueChange={field.onChange}>
//                                     <SelectTrigger>
//                                         <SelectValue placeholder="Выбери категорию" />
//                                     </SelectTrigger>
//                                     <SelectContent>
//                                         {PREP_CATEGORIES.map((c) => (
//                                             <SelectItem key={c} value={c}>
//                                                 {c}
//                                             </SelectItem>
//                                         ))}
//                                     </SelectContent>
//                                 </Select>
//                             )}
//                         />
//                     </div>
//                 </div>

//                 <Button type="button" variant="ghost" onClick={remove}>
//                     <Trash2 className="h-4 w-4" />
//                 </Button>
//             </div>

//             <div className="flex items-center justify-between gap-2">
//                 <div className="font-medium">Ингредиенты (склад 1)</div>
//                 <Button
//                     type="button"
//                     variant="outline"
//                     onClick={() => itemsFA.append({ productId: "", amountBase: "" })}
//                 >
//                     + Ингредиент
//                 </Button>
//             </div>

//             {itemsFA.fields.length === 0 ? (
//                 <div className="text-sm text-muted-foreground">Пока нет ингредиентов</div>
//             ) : (
//                 <div className="space-y-2">
//                     {itemsFA.fields.map((it, ii) => (
//                         <div key={it.id} className="rounded-md border p-3">
//                             <div className="flex items-start justify-between gap-2">
//                                 <div className="w-full space-y-2">
//                                     <Controller
//                                         control={control}
//                                         name={`complexGroups.${index}.items.${ii}.productId`}
//                                         render={({ field }) => (
//                                             <ProductPicker value={field.value} onChange={field.onChange} />
//                                         )}
//                                     />

//                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
//                                         <div className="space-y-1">
//                                             <Label className="text-xs text-muted-foreground">Количество (г)</Label>
//                                             <Input
//                                                 type="number"
//                                                 inputMode="decimal"
//                                                 {...register(`complexGroups.${index}.items.${ii}.amountBase`)}
//                                                 placeholder="например 260"
//                                             />
//                                         </div>
//                                     </div>
//                                 </div>

//                                 <Button type="button" variant="ghost" onClick={() => itemsFA.remove(ii)}>
//                                     <Trash2 className="h-4 w-4" />
//                                 </Button>
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             )}
//         </div>
//     );
// }


"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { toast } from "sonner";

import {
    Dialog,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { PlusIcon, Trash2, CheckCircle2 } from "lucide-react";

import { getProducts } from "@/app/actions/products/getProducts";
import { getRecipesByType } from "@/app/actions/recipes/getRecipesByType";
import { createRecipe } from "@/app/actions/recipes/createRecipe";

const PREP_CATEGORIES = ["Крема", "Бисквиты", "Промочки", "Прочее"];

function toNum(v, fallback = 0) {
    const n = Number(String(v ?? "").replace(",", "."));
    return Number.isFinite(n) ? n : fallback;
}

function cx(...xs) {
    return xs.filter(Boolean).join(" ");
}

function isEmptyStr(v) {
    return !String(v ?? "").trim();
}

function isPositive(v) {
    return toNum(v, 0) > 0;
}

function IconButton({ title, onClick, disabled, children }) {
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            disabled={disabled}
            onClick={(e) => {
                e.stopPropagation();
                if (!disabled) onClick?.();
            }}
            className={cx(
                "inline-flex items-center justify-center rounded-md p-1 transition",
                disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-muted"
            )}
        >
            {children}
        </button>
    );
}

export default function AddRecipeForm({ onCreated, defaultRecipeType = "filling" }) {
    const [open, setOpen] = useState(false);

    const [products, setProducts] = useState([]);
    const [preps, setPreps] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [loadingPreps, setLoadingPreps] = useState(false);

    const [openGroups, setOpenGroups] = useState([]);

    const form = useForm({
        mode: "onSubmit",
        defaultValues: {
            name: "",
            type: defaultRecipeType, // filling / preparation
            defaultYieldBase: 1000,
            steps: "",
            note: "",
            simpleItems: [], // { kind, productType, prepCategory, productId, childRecipeId, amountBase, collapsed }
            complexGroups: [], // { name, category, items:[{ productType, productId, amountBase, collapsed }] }
        },
    });

    const {
        control,
        register,
        handleSubmit,
        watch,
        reset,
        setValue,
        setError,
        clearErrors,
        formState: { errors },
    } = form;

    const recipeType = watch("type");

    const simpleFA = useFieldArray({ control, name: "simpleItems" });
    const groupsFA = useFieldArray({ control, name: "complexGroups" });

    useEffect(() => {
        async function fetchAll() {
            setLoadingProducts(true);
            setLoadingPreps(true);
            try {
                const [p, r] = await Promise.all([
                    getProducts(),
                    getRecipesByType("preparation"),
                ]);

                setProducts(Array.isArray(p) ? p : []);
                setPreps(Array.isArray(r) ? r : []);
            } catch (e) {
                console.error(e);
                toast.error("Не удалось загрузить справочники");
            } finally {
                setLoadingProducts(false);
                setLoadingPreps(false);
            }
        }

        if (open) fetchAll();
    }, [open]);

    const productById = useMemo(() => {
        const map = new Map();
        for (const p of products) map.set(p.id, p);
        return map;
    }, [products]);

    const prepById = useMemo(() => {
        const map = new Map();
        for (const r of preps) map.set(r.id, r);
        return map;
    }, [preps]);

    const productsByType = useMemo(() => {
        const map = new Map();
        for (const p of products) {
            const t = p.type || "—";
            if (!map.has(t)) map.set(t, []);
            map.get(t).push(p);
        }
        return map;
    }, [products]);

    const prepsByCategory = useMemo(() => {
        const map = new Map();
        for (const r of preps) {
            const c = r.preparationCategory || "Прочее";
            if (!map.has(c)) map.set(c, []);
            map.get(c).push(r);
        }
        return map;
    }, [preps]);

    function ProductPicker({
        typeValue,
        onTypeChange,
        productValue,
        onProductChange,
        disabled,
        invalidType,
        invalidProduct,
    }) {
        const types = useMemo(() => {
            return Array.from(productsByType.keys()).filter(Boolean);
        }, [productsByType]);

        const list = useMemo(() => {
            if (!typeValue) return [];
            return productsByType.get(typeValue) || [];
        }, [typeValue, productsByType]);

        const productDisabled = disabled || !typeValue;

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                    <Label className="text-xs text-muted-foreground">Тип</Label>
                    <Select
                        value={typeValue || ""}
                        onValueChange={(v) => {
                            onTypeChange?.(v);
                            onProductChange?.("");
                        }}
                        disabled={disabled}
                    >
                        <SelectTrigger className={invalidType ? "border-red-500" : ""}>
                            <SelectValue placeholder="Выбери тип" />
                        </SelectTrigger>
                        <SelectContent>
                            {types.map((t) => (
                                <SelectItem key={t} value={t}>
                                    {t}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label className="text-xs text-muted-foreground">Ингредиент</Label>
                    <Select
                        value={productValue || ""}
                        onValueChange={(v) => onProductChange?.(v)}
                        disabled={productDisabled}
                    >
                        <SelectTrigger className={invalidProduct ? "border-red-500" : ""}>
                            <SelectValue
                                placeholder={
                                    loadingProducts
                                        ? "Загрузка..."
                                        : !typeValue
                                            ? "Сначала выбери тип"
                                            : "Выбери продукт"
                                }
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {list.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        );
    }

    function PrepPicker({
        catValue,
        onCatChange,
        prepValue,
        onPrepChange,
        disabled,
        invalidCat,
        invalidPrep,
    }) {
        const list = useMemo(() => {
            if (!catValue) return [];
            return prepsByCategory.get(catValue) || [];
        }, [catValue, prepsByCategory]);

        const prepDisabled = disabled || !catValue;

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                    <Label className="text-xs text-muted-foreground">Категория</Label>
                    <Select
                        value={catValue || ""}
                        onValueChange={(v) => {
                            onCatChange?.(v);
                            onPrepChange?.("");
                        }}
                        disabled={disabled}
                    >
                        <SelectTrigger className={invalidCat ? "border-red-500" : ""}>
                            <SelectValue placeholder="Сначала выбери категорию" />
                        </SelectTrigger>
                        <SelectContent>
                            {PREP_CATEGORIES.map((c) => (
                                <SelectItem key={c} value={c}>
                                    {c}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label className="text-xs text-muted-foreground">Заготовка</Label>
                    <Select
                        value={prepValue || ""}
                        onValueChange={(v) => onPrepChange?.(v)}
                        disabled={prepDisabled}
                    >
                        <SelectTrigger className={invalidPrep ? "border-red-500" : ""}>
                            <SelectValue
                                placeholder={
                                    loadingPreps
                                        ? "Загрузка..."
                                        : !catValue
                                            ? "Сначала выбери категорию"
                                            : "Выбери заготовку"
                                }
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {list.map((r) => (
                                <SelectItem key={r.id} value={r.id}>
                                    {r.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        );
    }

    function computeGroupTotal(gIndex) {
        const items = watch(`complexGroups.${gIndex}.items`) || [];
        return items.reduce((acc, it) => acc + toNum(it?.amountBase, 0), 0);
    }

    function isComplexGroupValid(gIndex) {
        const name = watch(`complexGroups.${gIndex}.name`);
        const category = watch(`complexGroups.${gIndex}.category`);
        const items = watch(`complexGroups.${gIndex}.items`) || [];

        if (isEmptyStr(name)) return false;
        if (isEmptyStr(category)) return false;
        if (items.length === 0) return false;

        for (const it of items) {
            if (isEmptyStr(it?.productType)) return false;
            if (isEmptyStr(it?.productId)) return false;
            if (!isPositive(it?.amountBase)) return false;
        }

        return true;
    }

    function isComplexItemValid(gIndex, itemIndex) {
        const t = watch(`complexGroups.${gIndex}.items.${itemIndex}.productType`);
        const pid = watch(`complexGroups.${gIndex}.items.${itemIndex}.productId`);
        const amt = watch(`complexGroups.${gIndex}.items.${itemIndex}.amountBase`);
        return !isEmptyStr(t) && !isEmptyStr(pid) && isPositive(amt);
    }

    function isSimpleItemValid(i) {
        const kind = watch(`simpleItems.${i}.kind`) || "product";
        const amtOk = isPositive(watch(`simpleItems.${i}.amountBase`));
        if (!amtOk) return false;

        if (kind === "prep") {
            const c = watch(`simpleItems.${i}.prepCategory`);
            const id = watch(`simpleItems.${i}.childRecipeId`);
            return !isEmptyStr(c) && !isEmptyStr(id);
        }

        const t = watch(`simpleItems.${i}.productType`);
        const id = watch(`simpleItems.${i}.productId`);
        return !isEmptyStr(t) && !isEmptyStr(id);
    }

    function getSimpleHeader(i) {
        const kind = watch(`simpleItems.${i}.kind`) || "product";

        if (kind === "prep") {
            const id = watch(`simpleItems.${i}.childRecipeId`);
            const r = id ? prepById.get(id) : null;
            return { title: r?.name || "Заготовка", tag: r?.preparationCategory || "Склад 2" };
        }

        const id = watch(`simpleItems.${i}.productId`);
        const p = id ? productById.get(id) : null;
        return { title: p?.name || "Ингредиент", tag: p?.type || "Склад 1" };
    }

    function validateAndMark(values) {
        clearErrors();
        let ok = true;

        if (isEmptyStr(values.name)) {
            setError("name", { type: "required", message: "Название обязательно" });
            ok = false;
        }

        const y = toNum(values.defaultYieldBase, 0);
        if (!(y >= 1000)) {
            setError("defaultYieldBase", { type: "min", message: "Минимум 1000 г" });
            ok = false;
        }

        (values.simpleItems || []).forEach((x, i) => {
            const kind = x.kind || "product";

            if (!isPositive(x.amountBase)) {
                setError(`simpleItems.${i}.amountBase`, { type: "min", message: "Количество > 0" });
                ok = false;
            }

            if (kind === "prep") {
                if (isEmptyStr(x.prepCategory)) {
                    setError(`simpleItems.${i}.prepCategory`, { type: "required", message: "Категория обязательна" });
                    ok = false;
                }
                if (isEmptyStr(x.childRecipeId)) {
                    setError(`simpleItems.${i}.childRecipeId`, { type: "required", message: "Выбери заготовку" });
                    ok = false;
                }
            } else {
                if (isEmptyStr(x.productType)) {
                    setError(`simpleItems.${i}.productType`, { type: "required", message: "Тип обязателен" });
                    ok = false;
                }
                if (isEmptyStr(x.productId)) {
                    setError(`simpleItems.${i}.productId`, { type: "required", message: "Выбери продукт" });
                    ok = false;
                }
            }
        });

        (values.complexGroups || []).forEach((g, gi) => {
            if (isEmptyStr(g.name)) {
                setError(`complexGroups.${gi}.name`, { type: "required", message: "Название обязательно" });
                ok = false;
            }

            if (isEmptyStr(g.category)) {
                setError(`complexGroups.${gi}.category`, { type: "required", message: "Категория обязательна" });
                ok = false;
            }

            const items = g.items || [];
            if (items.length === 0) {
                setError(`complexGroups.${gi}.items`, { type: "min", message: "Добавь ингредиенты" });
                ok = false;
            }

            items.forEach((it, ii) => {
                if (isEmptyStr(it.productType)) {
                    setError(`complexGroups.${gi}.items.${ii}.productType`, { type: "required", message: "Тип обязателен" });
                    ok = false;
                }
                if (isEmptyStr(it.productId)) {
                    setError(`complexGroups.${gi}.items.${ii}.productId`, { type: "required", message: "Выбери продукт" });
                    ok = false;
                }
                if (!isPositive(it.amountBase)) {
                    setError(`complexGroups.${gi}.items.${ii}.amountBase`, { type: "min", message: "Количество > 0" });
                    ok = false;
                }
            });

            const groupHasError =
                isEmptyStr(g.name) ||
                isEmptyStr(g.category) ||
                items.length === 0 ||
                items.some((it) => isEmptyStr(it.productType) || isEmptyStr(it.productId) || !isPositive(it.amountBase));

            if (groupHasError) {
                const key = `group-${gi}`;
                setOpenGroups((prev) => (prev.includes(key) ? prev : [...prev, key]));
            }
        });

        if (!ok) toast.error("Проверь поля, есть ошибки");
        return ok;
    }

    async function onSubmit(values) {
        const valid = validateAndMark(values);
        if (!valid) return;

        try {
            const payload = {
                name: values.name.trim(),
                type: values.type,
                defaultYieldBase: toNum(values.defaultYieldBase, 1000),
                steps: values.steps || "",
                note: values.note || "",

                simpleItems: (values.simpleItems || []).map((x) => {
                    const kind = x.kind || "product";
                    const amountBase = toNum(x.amountBase, 0);

                    if (kind === "prep") {
                        return {
                            refType: "recipe",
                            childRecipeId: x.childRecipeId || null,
                            productId: null,
                            amountBase,
                        };
                    }

                    return {
                        refType: "product",
                        productId: x.productId || null,
                        childRecipeId: null,
                        amountBase,
                    };
                }),

                complexGroups: (values.complexGroups || []).map((g) => ({
                    name: (g.name || "").trim(),
                    category: g.category || null,
                    items: (g.items || []).map((it) => ({
                        productId: it.productId || null,
                        amountBase: toNum(it.amountBase, 0),
                    })),
                })),
            };

            await createRecipe(payload);
            toast.success("Техкарта создана");

            setOpen(false);
            reset({
                name: "",
                type: defaultRecipeType,
                defaultYieldBase: 1000,
                steps: "",
                note: "",
                simpleItems: [],
                complexGroups: [],
            });
            setOpenGroups([]);
            onCreated?.();
        } catch (e) {
            console.error(e);
            toast.error(e?.message || "Ошибка создания техкарты");
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <PlusIcon className="h-4 w-4" />
                    Добавить техкарту
                </Button>
            </DialogTrigger>

            <DialogContent
                className="
                    p-0
                    w-[96vw]
                    max-w-[96vw]
                    sm:max-w-3xl
                    md:max-w-4xl
                    lg:max-w-5xl
                    overflow-hidden
                "
            >
                <div className="flex flex-col max-h-[90vh]">
                    <div className="p-4 sm:p-6 pb-3">
                        <DialogHeader>
                            <DialogTitle>Новая техкарта</DialogTitle>
                            <DialogDescription>
                                Начинка может содержать сложные ингредиенты, которые будут созданы как отдельные заготовки.
                                Также можно добавить уже существующую заготовку.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="px-4 sm:px-6 pb-6 overflow-y-auto">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label>Название</Label>
                                    <Input
                                        {...register("name")}
                                        placeholder="Красный бархат"
                                        className={errors.name ? "border-red-500" : ""}
                                    />
                                    {errors.name ? (
                                        <div className="text-xs text-red-600">{errors.name.message}</div>
                                    ) : null}
                                </div>

                                <div className="space-y-1">
                                    <Label>Тип</Label>
                                    <Controller
                                        control={control}
                                        name="type"
                                        render={({ field }) => (
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Выбери тип" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="filling">Начинка</SelectItem>
                                                    <SelectItem value="preparation">Заготовка</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label>Необходимый вес (г)</Label>
                                    <Input
                                        type="number"
                                        inputMode="decimal"
                                        {...register("defaultYieldBase")}
                                        placeholder="1000"
                                        className={errors.defaultYieldBase ? "border-red-500" : ""}
                                    />
                                    {errors.defaultYieldBase ? (
                                        <div className="text-xs text-red-600">{errors.defaultYieldBase.message}</div>
                                    ) : null}
                                </div>
                            </div>

                            {/* Complex groups */}
                            <div className="rounded-md border p-3 space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <div className="font-semibold">Сложные ингредиенты</div>
                                        <div className="text-sm text-muted-foreground">
                                            Будут созданы как отдельные заготовки (preparation).
                                        </div>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            const newIndex = groupsFA.fields.length;
                                            groupsFA.append({ name: "", category: "Крема", items: [] });
                                            setOpenGroups((prev) => [...prev, `group-${newIndex}`]);
                                        }}
                                        disabled={recipeType !== "filling"}
                                    >
                                        + Добавить
                                    </Button>
                                </div>

                                {groupsFA.fields.length === 0 ? (
                                    <div className="text-sm text-muted-foreground">Нет сложных ингредиентов</div>
                                ) : (
                                    <Accordion
                                        type="multiple"
                                        value={openGroups}
                                        onValueChange={setOpenGroups}
                                        className="space-y-2"
                                    >
                                        {groupsFA.fields.map((g, gi) => (
                                            <AccordionItem key={g.id} value={`group-${gi}`} className="border rounded-md">
                                                <AccordionTrigger className="px-3 py-2">
                                                    <GroupHeader
                                                        index={gi}
                                                        watch={watch}
                                                        computeTotal={() => computeGroupTotal(gi)}
                                                        errors={errors}
                                                    />
                                                </AccordionTrigger>

                                                <AccordionContent className="p-0">
                                                    <ComplexGroupBody
                                                        control={control}
                                                        register={register}
                                                        index={gi}
                                                        remove={() => groupsFA.remove(gi)}
                                                        setValue={setValue}
                                                        clearErrors={clearErrors}  // ✅ FIX
                                                        watch={watch}
                                                        errors={errors}
                                                        openGroups={openGroups}
                                                        setOpenGroups={setOpenGroups}
                                                        isGroupValid={() => isComplexGroupValid(gi)}
                                                        isItemValid={(ii) => isComplexItemValid(gi, ii)}
                                                        products={products}
                                                        productById={productById}
                                                        ProductPicker={ProductPicker}
                                                    />
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                )}
                            </div>

                            {/* Simple items */}
                            <div className="rounded-md border p-3 space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <div className="font-semibold">Компоненты</div>
                                        <div className="text-sm text-muted-foreground">
                                            Продукт (склад 1) или существующая заготовка (склад 2).
                                        </div>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            simpleFA.append({
                                                kind: "product",
                                                productType: "",
                                                prepCategory: "",
                                                productId: "",
                                                childRecipeId: "",
                                                amountBase: "",
                                                collapsed: false,
                                            })
                                        }
                                    >
                                        + Добавить
                                    </Button>
                                </div>

                                {simpleFA.fields.length === 0 ? (
                                    <div className="text-sm text-muted-foreground">Нет компонентов</div>
                                ) : (
                                    <div className="space-y-2">
                                        {simpleFA.fields.map((f, i) => {
                                            const kind = watch(`simpleItems.${i}.kind`) || "product";
                                            const invalidAmount = !!errors?.simpleItems?.[i]?.amountBase;

                                            const hdr = getSimpleHeader(i);

                                            const collapsed = !!watch(`simpleItems.${i}.collapsed`);
                                            const canCollapse = isSimpleItemValid(i);

                                            function toggleSimpleCollapseIfValid() {
                                                if (!canCollapse) return;
                                                setValue(`simpleItems.${i}.collapsed`, !collapsed);
                                            }

                                            return (
                                                <div key={f.id} className="rounded-md border p-3">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="min-w-0 flex items-center gap-2 flex-wrap">
                                                            <div className="font-medium truncate max-w-[56vw] sm:max-w-none">
                                                                {hdr.title}
                                                            </div>
                                                            {hdr.tag ? <Badge variant="outline">{hdr.tag}</Badge> : null}
                                                            {canCollapse ? (
                                                                <Badge variant="secondary">{collapsed ? "Свернут" : "Заполнен"}</Badge>
                                                            ) : (
                                                                <Badge variant="outline">Заполни</Badge>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <IconButton
                                                                title={canCollapse ? (collapsed ? "Развернуть" : "Свернуть") : "Заполни компонент, чтобы свернуть"}
                                                                disabled={!canCollapse}
                                                                onClick={toggleSimpleCollapseIfValid}
                                                            >
                                                                <CheckCircle2 className="h-5 w-5" />
                                                            </IconButton>

                                                            <Button type="button" variant="ghost" onClick={() => simpleFA.remove(i)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {collapsed ? null : (
                                                        <div className="mt-3 space-y-2">
                                                            <div className="w-full md:max-w-[280px]">
                                                                <Label className="text-xs text-muted-foreground">Тип компонента</Label>
                                                                <Controller
                                                                    control={control}
                                                                    name={`simpleItems.${i}.kind`}
                                                                    render={({ field }) => (
                                                                        <Select
                                                                            value={field.value || "product"}
                                                                            onValueChange={(v) => {
                                                                                field.onChange(v);

                                                                                if (v === "product") {
                                                                                    setValue(`simpleItems.${i}.prepCategory`, "");
                                                                                    setValue(`simpleItems.${i}.childRecipeId`, "");
                                                                                    clearErrors([
                                                                                        `simpleItems.${i}.prepCategory`,
                                                                                        `simpleItems.${i}.childRecipeId`,
                                                                                    ]);
                                                                                } else {
                                                                                    setValue(`simpleItems.${i}.productType`, "");
                                                                                    setValue(`simpleItems.${i}.productId`, "");
                                                                                    clearErrors([
                                                                                        `simpleItems.${i}.productType`,
                                                                                        `simpleItems.${i}.productId`,
                                                                                    ]);
                                                                                }

                                                                                setValue(`simpleItems.${i}.collapsed`, false);
                                                                            }}
                                                                        >
                                                                            <SelectTrigger>
                                                                                <SelectValue placeholder="Выбери" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="product">Продукт (склад 1)</SelectItem>
                                                                                <SelectItem value="prep">Заготовка (склад 2)</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    )}
                                                                />
                                                            </div>

                                                            {kind === "product" ? (
                                                                <ProductPicker
                                                                    typeValue={watch(`simpleItems.${i}.productType`)}
                                                                    onTypeChange={(v) => {
                                                                        setValue(`simpleItems.${i}.productType`, v);
                                                                        clearErrors(`simpleItems.${i}.productType`);
                                                                    }}
                                                                    productValue={watch(`simpleItems.${i}.productId`)}
                                                                    onProductChange={(v) => {
                                                                        setValue(`simpleItems.${i}.productId`, v);
                                                                        clearErrors(`simpleItems.${i}.productId`);
                                                                        setValue(`simpleItems.${i}.collapsed`, false);
                                                                    }}
                                                                    disabled={false}
                                                                    invalidType={!!errors?.simpleItems?.[i]?.productType}
                                                                    invalidProduct={!!errors?.simpleItems?.[i]?.productId}
                                                                />
                                                            ) : (
                                                                <PrepPicker
                                                                    catValue={watch(`simpleItems.${i}.prepCategory`)}
                                                                    onCatChange={(v) => {
                                                                        setValue(`simpleItems.${i}.prepCategory`, v);
                                                                        clearErrors(`simpleItems.${i}.prepCategory`);
                                                                    }}
                                                                    prepValue={watch(`simpleItems.${i}.childRecipeId`)}
                                                                    onPrepChange={(v) => {
                                                                        setValue(`simpleItems.${i}.childRecipeId`, v);
                                                                        clearErrors(`simpleItems.${i}.childRecipeId`);
                                                                        setValue(`simpleItems.${i}.collapsed`, false);
                                                                    }}
                                                                    disabled={false}
                                                                    invalidCat={!!errors?.simpleItems?.[i]?.prepCategory}
                                                                    invalidPrep={!!errors?.simpleItems?.[i]?.childRecipeId}
                                                                />
                                                            )}

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs text-muted-foreground">Количество (г)</Label>
                                                                    <Input
                                                                        type="number"
                                                                        inputMode="decimal"
                                                                        {...register(`simpleItems.${i}.amountBase`)}
                                                                        placeholder="например 120"
                                                                        className={invalidAmount ? "border-red-500" : ""}
                                                                        onChange={(e) => {
                                                                            setValue(`simpleItems.${i}.amountBase`, e.target.value);
                                                                            clearErrors(`simpleItems.${i}.amountBase`);
                                                                            setValue(`simpleItems.${i}.collapsed`, false);
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <div className="space-y-1">
                                    <Label>Шаги/описание</Label>
                                    <Input {...register("steps")} placeholder="Краткое описание..." />
                                </div>
                                <div className="space-y-1">
                                    <Label>Заметка</Label>
                                    <Input {...register("note")} placeholder="Примечание..." />
                                </div>
                            </div>

                            <Separator />
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                    Отмена
                                </Button>
                                <Button type="submit">Создать</Button>
                            </div>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function GroupHeader({ index, watch, computeTotal, errors }) {
    const name = watch(`complexGroups.${index}.name`) || `Сложный ингредиент #${index + 1}`;
    const cat = watch(`complexGroups.${index}.category`) || "";
    const total = computeTotal();

    const hasError =
        !!errors?.complexGroups?.[index]?.name ||
        !!errors?.complexGroups?.[index]?.category ||
        !!errors?.complexGroups?.[index]?.items;

    return (
        <div className="w-full flex items-center justify-between gap-2">
            <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-medium truncate max-w-[56vw] sm:max-w-none">{name}</div>
                    {cat ? <Badge variant="outline">{cat}</Badge> : null}
                    <Badge variant="secondary">итого: {Math.round(total)} г</Badge>
                    {hasError ? <Badge variant="destructive">Ошибки</Badge> : null}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                    Нажми чтобы развернуть/свернуть
                </div>
            </div>
        </div>
    );
}

function ComplexGroupBody({
    control,
    register,
    index,
    remove,
    setValue,
    clearErrors, // ✅ теперь есть
    watch,
    errors,
    setOpenGroups,
    isGroupValid,
    isItemValid,
    productById,
    ProductPicker,
}) {
    const itemsFA = useFieldArray({
        control,
        name: `complexGroups.${index}.items`,
    });

    const groupKey = `group-${index}`;

    function collapseGroupIfValid() {
        if (!isGroupValid()) return;
        setOpenGroups((prev) => prev.filter((x) => x !== groupKey));
    }

    const nameInvalid = !!errors?.complexGroups?.[index]?.name;
    const catInvalid = !!errors?.complexGroups?.[index]?.category;
    const itemsInvalid = !!errors?.complexGroups?.[index]?.items;

    return (
        <div className="p-3 space-y-3">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
                    <div className="space-y-1">
                        <Label>Название (например Крем)</Label>
                        <Input
                            {...register(`complexGroups.${index}.name`)}
                            placeholder="Крем"
                            className={nameInvalid ? "border-red-500" : ""}
                            onChange={(e) => {
                                setValue(`complexGroups.${index}.name`, e.target.value);
                                clearErrors(`complexGroups.${index}.name`);
                            }}
                        />
                    </div>

                    <div className="space-y-1">
                        <Label>Категория</Label>
                        <Controller
                            control={control}
                            name={`complexGroups.${index}.category`}
                            render={({ field }) => (
                                <Select
                                    value={field.value || "Крема"}
                                    onValueChange={(v) => {
                                        field.onChange(v);
                                        clearErrors(`complexGroups.${index}.category`);
                                    }}
                                >
                                    <SelectTrigger className={catInvalid ? "border-red-500" : ""}>
                                        <SelectValue placeholder="Выбери категорию" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PREP_CATEGORIES.map((c) => (
                                            <SelectItem key={c} value={c}>
                                                {c}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 justify-end">
                    <IconButton
                        title={isGroupValid() ? "Свернуть" : "Заполни группу, чтобы свернуть"}
                        disabled={!isGroupValid()}
                        onClick={collapseGroupIfValid}
                    >
                        <CheckCircle2 className="h-5 w-5" />
                    </IconButton>

                    <Button type="button" variant="ghost" onClick={remove}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="flex items-center justify-between gap-2">
                <div className="font-medium">Ингредиенты (склад 1)</div>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => itemsFA.append({ productType: "", productId: "", amountBase: "", collapsed: false })}
                >
                    + Ингредиент
                </Button>
            </div>

            {itemsInvalid ? <div className="text-sm text-red-600">Добавь хотя бы один ингредиент</div> : null}

            {itemsFA.fields.length === 0 ? (
                <div className="text-sm text-muted-foreground">Пока нет ингредиентов</div>
            ) : (
                <div className="space-y-2">
                    {itemsFA.fields.map((it, ii) => {
                        const typeInvalid = !!errors?.complexGroups?.[index]?.items?.[ii]?.productType;
                        const pidInvalid = !!errors?.complexGroups?.[index]?.items?.[ii]?.productId;
                        const amtInvalid = !!errors?.complexGroups?.[index]?.items?.[ii]?.amountBase;

                        const collapsed = !!watch(`complexGroups.${index}.items.${ii}.collapsed`);
                        const canCollapse = isItemValid(ii);

                        const pid = watch(`complexGroups.${index}.items.${ii}.productId`);
                        const p = pid ? productById.get(pid) : null;

                        const title = p?.name || "Ингредиент";
                        const typeTag = p?.type || "";

                        function toggleCollapseIfValid() {
                            if (!canCollapse) return;
                            setValue(`complexGroups.${index}.items.${ii}.collapsed`, !collapsed);
                        }

                        return (
                            <div key={it.id} className="rounded-md border p-3">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0 flex items-center gap-2 flex-wrap">
                                        <div className="font-medium text-sm truncate max-w-[56vw] sm:max-w-none">
                                            {title}
                                        </div>
                                        {typeTag ? <Badge variant="outline">{typeTag}</Badge> : null}

                                        {(typeInvalid || pidInvalid || amtInvalid) ? (
                                            <Badge variant="destructive">Ошибки</Badge>
                                        ) : canCollapse ? (
                                            <Badge variant="secondary">{collapsed ? "Свернут" : "Заполнен"}</Badge>
                                        ) : (
                                            <Badge variant="outline">Заполни</Badge>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <IconButton
                                            title={canCollapse ? (collapsed ? "Развернуть" : "Свернуть") : "Заполни ингредиент, чтобы свернуть"}
                                            disabled={!canCollapse}
                                            onClick={toggleCollapseIfValid}
                                        >
                                            <CheckCircle2 className="h-5 w-5" />
                                        </IconButton>

                                        <Button type="button" variant="ghost" onClick={() => itemsFA.remove(ii)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {collapsed ? null : (
                                    <div className="mt-3 space-y-2">
                                        <ProductPicker
                                            typeValue={watch(`complexGroups.${index}.items.${ii}.productType`)}
                                            onTypeChange={(v) => {
                                                setValue(`complexGroups.${index}.items.${ii}.productType`, v);
                                                clearErrors(`complexGroups.${index}.items.${ii}.productType`);
                                            }}
                                            productValue={watch(`complexGroups.${index}.items.${ii}.productId`)}
                                            onProductChange={(v) => {
                                                setValue(`complexGroups.${index}.items.${ii}.productId`, v);
                                                clearErrors(`complexGroups.${index}.items.${ii}.productId`);
                                                setValue(`complexGroups.${index}.items.${ii}.collapsed`, false);
                                            }}
                                            disabled={false}
                                            invalidType={typeInvalid}
                                            invalidProduct={pidInvalid}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">Количество (г)</Label>
                                                <Input
                                                    type="number"
                                                    inputMode="decimal"
                                                    {...register(`complexGroups.${index}.items.${ii}.amountBase`)}
                                                    placeholder="например 260"
                                                    className={amtInvalid ? "border-red-500" : ""}
                                                    onChange={(e) => {
                                                        setValue(`complexGroups.${index}.items.${ii}.amountBase`, e.target.value);
                                                        clearErrors(`complexGroups.${index}.items.${ii}.amountBase`);
                                                        setValue(`complexGroups.${index}.items.${ii}.collapsed`, false);
                                                    }}
                                                />
                                                {amtInvalid ? (
                                                    <div className="text-xs text-red-600">Количество должно быть &gt; 0</div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
