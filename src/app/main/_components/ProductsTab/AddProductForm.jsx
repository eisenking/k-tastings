// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//     Dialog,
//     DialogContent,
//     DialogHeader,
//     DialogTitle,
//     DialogTrigger,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { PlusIcon } from "lucide-react";
// import { useForm } from "react-hook-form";
// import { z } from "zod";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { toast } from "sonner";
// import { addProduct } from "@/app/actions/products/addProduct";
// import { getProductSuggestions } from "@/app/actions/products/getProductSuggestions";

// const PRODUCT_TYPES = ["сырье", "полуфабрикат", "готовый продукт", "упаковка"];
// const UNITS = ["г", "кг", "мл", "л", "шт"];

// const schema = z.object({
//     productId: z.string().optional(), // необязательный
//     name: z.string().min(1),
//     type: z.enum(PRODUCT_TYPES),
//     baseUnit: z.enum(UNITS),
//     variantName: z.string().optional(),
//     variantUnit: z.enum(UNITS),
//     conversionToBase: z.number().optional(),
//     quantity: z.number().positive(),
//     price: z.number().positive(),
//     expirationDate: z.string().optional(),
// });

// export default function AddProductForm() {
//     const router = useRouter();
//     const [open, setOpen] = useState(false);
//     const [suggestions, setSuggestions] = useState([]);

//     const {
//         register,
//         handleSubmit,
//         watch,
//         setValue,
//         reset,
//         formState: { isSubmitting },
//     } = useForm({
//         resolver: zodResolver(schema),
//         defaultValues: {
//             type: "сырье",
//             baseUnit: "кг",
//             variantUnit: "шт",
//         },
//     });

//     const watchName = watch("name");
//     const watchBaseUnit = watch("baseUnit");
//     const watchVariantUnit = watch("variantUnit");

//     // --------------------------
//     // Автокомплит продуктов
//     // --------------------------
//     useEffect(() => {
//         if (!watchName || watchName.length < 2) {
//             setSuggestions([]);
//             return;
//         }

//         const loadSuggestions = async () => {
//             const res = await getProductSuggestions(watchName);
//             setSuggestions(res);
//         };

//         loadSuggestions();
//     }, [watchName]);

//     // --------------------------
//     // Автогенерация variantName для "шт"
//     // --------------------------
//     useEffect(() => {
//         if (watchBaseUnit === "шт" && watchName) {
//             setValue("variantName", `Пакет 1${watchVariantUnit}`);
//         } else if (watchBaseUnit !== "шт") {
//             setValue("variantName", watchName);
//             setValue("variantUnit", watchBaseUnit);
//             setValue("conversionToBase", 1);
//         }
//     }, [watchBaseUnit, watchVariantUnit, watchName, setValue]);

//     // --------------------------
//     // Submit
//     // --------------------------
//     const onSubmit = async (data) => {
//         try {
//             await addProduct({
//                 name: data.name,
//                 type: data.type,
//                 baseUnit: data.baseUnit,
//                 variantName: data.variantName || data.name,
// 				variantUnit: data.variantUnit || data.baseUnit,
//                 conversionToBase: data.conversionToBase ?? 1,
//                 quantity: data.quantity,
//                 price: data.price,
//                 expirationDate: data.expirationDate
//                     ? new Date(data.expirationDate)
//                     : null,
//             });

//             toast.success("Продукт добавлен");
//             reset();
//             setOpen(false);
//             router.refresh();
//         } catch (e) {
//             toast.error("Ошибка добавления продукта");
//             console.error(e);
//         }
//     };

//     return (
//         <Dialog open={open} onOpenChange={setOpen}>
//             <DialogTrigger asChild>
//                 <Button>
//                     <PlusIcon className="w-4 h-4 mr-2" />
//                     Добавить
//                 </Button>
//             </DialogTrigger>

//             <DialogContent className="max-w-md">
//                 <DialogHeader>
//                     <DialogTitle>Приход на склад</DialogTitle>
//                 </DialogHeader>

//                 <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//                     {/* NAME + AUTOCOMPLETE */}
//                     <div className="relative">
//                         <Input
//                             {...register("name")}
//                             placeholder="Название продукта"
//                             autoComplete="off"
//                         />
//                         {suggestions.length > 0 && (
//                             <div className="absolute z-10 w-full bg-background border rounded shadow">
//                                 {suggestions.map((p) => (
//                                     <div
//                                         key={p.id}
//                                         className="px-3 py-2 text-sm hover:bg-muted cursor-pointer"
//                                         onClick={() => {
//                                             setValue("name", p.name);
//                                             setValue("productId", p.id);
//                                             setValue("type", p.type);
//                                             setValue("baseUnit", p.baseUnit);
//                                             setSuggestions([]);
//                                         }}
//                                     >
//                                         {p.name}
//                                     </div>
//                                 ))}
//                             </div>
//                         )}
//                     </div>

//                     {/* TYPE */}
//                     <div>
//                         <Label>Тип продукта</Label>
//                         <div className="flex gap-2 flex-wrap">
//                             {PRODUCT_TYPES.map((t) => (
//                                 <Button
//                                     type="button"
//                                     key={t}
//                                     variant={watch("type") === t ? "default" : "outline"}
//                                     onClick={() => setValue("type", t)}
//                                 >
//                                     {t}
//                                 </Button>
//                             ))}
//                         </div>
//                     </div>

//                     {/* BASE UNIT */}
//                     <div>
//                         <Label>Единица продукта</Label>
//                         <div className="flex gap-2 flex-wrap">
//                             {UNITS.map((u) => (
//                                 <Button
//                                     type="button"
//                                     key={u}
//                                     variant={watchBaseUnit === u ? "default" : "outline"}
//                                     onClick={() => setValue("baseUnit", u)}
//                                 >
//                                     {u}
//                                 </Button>
//                             ))}
//                         </div>
//                     </div>

//                     {/* VARIANT: только если 'шт' */}
//                     {watchBaseUnit === "шт" && (
//                         <>
//                             <Input
//                                 {...register("variantName")}
//                                 placeholder="Название варианта (например: Пакет 1шт)"
//                             />

//                             <div>
//                                 <Label>Единица варианта</Label>
//                                 <div className="flex gap-2 flex-wrap">
//                                     {UNITS.map((u) => (
//                                         <Button
//                                             type="button"
//                                             key={u}
//                                             variant={watchVariantUnit === u ? "default" : "outline"}
//                                             onClick={() => setValue("variantUnit", u)}
//                                         >
//                                             {u}
//                                         </Button>
//                                     ))}
//                                 </div>
//                             </div>

//                             <Input
//                                 type="number"
//                                 step="any"
//                                 {...register("conversionToBase", { valueAsNumber: true })}
//                                 placeholder="Коэффициент к базовой единице"
//                             />
//                         </>
//                     )}

//                     {/* QUANTITY */}
//                     <Input
//                         type="number"
//                         step="any"
//                         {...register("quantity", { valueAsNumber: true })}
//                         placeholder="Количество"
//                     />

//                     {/* PRICE */}
//                     <Input
//                         type="number"
//                         step="any"
//                         {...register("price", { valueAsNumber: true })}
//                         placeholder="Цена партии"
//                     />

//                     {/* EXPIRATION DATE */}
//                     <Input type="date" {...register("expirationDate")} />

//                     <Button type="submit" disabled={isSubmitting} className="w-full">
//                         {isSubmitting ? "Добавление..." : "Добавить"}
//                     </Button>
//                 </form>
//             </DialogContent>
//         </Dialog>
//     );
// }


"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { addProduct } from "@/app/actions/products/addProduct";
import { getProductSuggestions } from "@/app/actions/products/getProductSuggestions";

const PRODUCT_TYPES = ["молочные продукты", "сухие ингредиенты", "жиры", "шоколад и какао", "фрукты, ягоды и орехи", "добавки и ароматизаторы", "прочее"];
const UNITS = ["г", "кг", "мл", "л", "шт"];

const schema = z.object({
    productId: z.string().min(1).optional(),
    name: z.string().min(1),
    type: z.enum(PRODUCT_TYPES),
    baseUnit: z.enum(UNITS),
    variantName: z.string().optional(),
    variantUnit: z.enum(UNITS).optional(),
    conversionToBase: z.number().optional(),
    quantity: z.number().positive(),
    price: z.number().positive(),
    expirationDate: z.string().optional(),
});

export default function AddProductForm() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [suggestions, setSuggestions] = useState([]);

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
            type: "сырье",
            baseUnit: "кг",
            variantUnit: "шт",
        },
    });

    // Смотрим значения один раз
    const selectedType = watch("type");
    const selectedBaseUnit = watch("baseUnit");
    const selectedVariantUnit = watch("variantUnit");
    const watchName = watch("name");

    // --------------------------
    // Автокомплит продуктов
    // --------------------------
    useEffect(() => {
        if (!watchName || watchName.length < 2) {
            setSuggestions([]);
            return;
        }

        const loadSuggestions = async () => {
            const res = await getProductSuggestions(watchName);
            setSuggestions(res);
        };

        loadSuggestions();
    }, [watchName]);

    // --------------------------
    // Submit
    // --------------------------
    const onSubmit = async (data) => {
        try {
            await addProduct({
                name: data.name,
                type: data.type,
                baseUnit: data.baseUnit,
                variantName: data.baseUnit === "шт" ? data.variantName || data.name : data.name,
                variantUnit: data.baseUnit === "шт" ? data.variantUnit || "шт" : data.baseUnit,
                conversionToBase: data.baseUnit === "шт" ? data.conversionToBase || 1 : 1,
                quantity: data.quantity,
                price: data.price,
                expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
            });

            toast.success("Продукт добавлен");
            reset();
            setOpen(false);
            router.refresh();
        } catch (e) {
            toast.error("Ошибка добавления продукта");
            console.error(e);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Добавить
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md">
                <DialogHeader className="text-center">
                    <DialogTitle>Приход на склад</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* NAME + AUTOCOMPLETE */}
                    <div className="relative">
                        <Input
                            {...register("name")}
                            placeholder="Название продукта"
                            autoComplete="off"
                        />
                        {suggestions.length > 0 && (
                            <div className="absolute z-10 w-full bg-background border rounded shadow">
                                {suggestions.map((p) => (
                                    <div
                                        key={p.id}
                                        className="px-3 py-2 text-sm hover:bg-muted cursor-pointer"
                                        onClick={() => {
                                            setValue("name", p.name);
                                            setValue("productId", p.id);
                                            setValue("type", p.type);
                                            setValue("baseUnit", p.baseUnit);
                                            setSuggestions([]);
                                        }}
                                    >
                                        {p.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* TYPE */}
                    <div>
                        <Label className="mb-2">Тип продукта</Label>
                        <div className="flex gap-2 flex-wrap">
                            {PRODUCT_TYPES.map((t) => (
                                <Button
                                    type="button"
                                    key={t}
                                    variant={selectedType === t ? "default" : "outline"}
                                    onClick={() => setValue("type", t)}
                                >
                                    {t}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* BASE UNIT */}
                    <div>
                        <Label className="mb-2">Единица продукта</Label>
                        <div className="flex gap-2 flex-wrap">
                            {UNITS.map((u) => (
                                <Button
                                    type="button"
                                    key={u}
                                    variant={selectedBaseUnit === u ? "default" : "outline"}
                                    onClick={() => setValue("baseUnit", u)}
                                >
                                    {u}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* VARIANT: только если выбран 'шт' */}
                    {selectedBaseUnit === "шт" && (
                        <>
                            <Input
                                {...register("variantName")}
                                placeholder="Название варианта (например: Пакет 1шт)"
                            />

                            <div>
                                <Label>Единица варианта</Label>
                                <div className="flex gap-2 flex-wrap">
                                    {UNITS.map((u) => (
                                        <Button
                                            type="button"
                                            key={u}
                                            variant={selectedVariantUnit === u ? "default" : "outline"}
                                            onClick={() => setValue("variantUnit", u)}
                                        >
                                            {u}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <Input
                                type="number"
                                step="any"
                                {...register("conversionToBase", { valueAsNumber: true })}
                                placeholder="Коэффициент к базовой единице"
                            />
                        </>
                    )}

                    {/* QUANTITY */}
                    <Input
                        type="number"
                        step="any"
                        {...register("quantity", { valueAsNumber: true })}
                        placeholder="Количество"
                    />

                    {/* PRICE */}
                    <Input
                        type="number"
                        step="any"
                        {...register("price", { valueAsNumber: true })}
                        placeholder="Цена партии"
                    />

                    {/* EXPIRATION DATE */}
                    <Input type="date" {...register("expirationDate")} />

                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? "Добавление..." : "Добавить"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
