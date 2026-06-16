// "use client";
// import { useEffect, useMemo, useState, useTransition } from "react";
// import { transferProduct } from "@/actions/stock/products/transferProduct";
// import { getProductCategories } from "@/actions/stock/categories/getProductCategories";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//     Dialog,
//     DialogContent,
//     DialogDescription,
//     DialogHeader,
//     DialogTitle,
// } from "@/components/ui/dialog";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { toast } from "sonner";
// import { useRouter } from "next/navigation";
// import { toBase } from "@/lib/helpers/units";

// const format3 = (v) => {
//     const n = Number(v);
//     if (!Number.isFinite(n)) return "0.000";
//     return n.toFixed(3);
// };

// function unitsForMeasure(measure) {
//     if (measure === "volume") return ["мл", "л", "шт"];
//     return ["г", "кг", "шт"];
// }

// /**
//  * @param {{
//  *   open: boolean,
//  *   onOpenChange: (v: boolean) => void,
//  *   fromLocation: "pastry" | "cafe",
//  *   toLocation: "pastry" | "cafe",
//  *   productId: string,
//  *   productName: string,
//  *   baseUnit: "г" | "мл",
//  *   measure: "mass" | "volume",
//  *   pieceToBase: number | null,
//  *   availableBase: number,
//  * }} props
//  */
// export default function TransferProductDialog({
//     open,
//     onOpenChange,
//     fromLocation,
//     toLocation,
//     productId,
//     productName,
//     baseUnit,
//     measure,
//     pieceToBase,
//     availableBase,
// }) {
//     const router = useRouter();
//     const [isPending, startTransition] = useTransition();

//     const availableUnits = useMemo(() => unitsForMeasure(measure), [measure]);

//     const [inputUnit, setInputUnit] = useState(baseUnit);
//     const [quantity, setQuantity] = useState("");
//     const [reason, setReason] = useState("");

//     const [targetCategories, setTargetCategories] = useState([]);
//     const [targetCategoryId, setTargetCategoryId] = useState("");

//     const available = useMemo(() => {
//         const n = Number(availableBase);
//         return Number.isFinite(n) ? n : 0;
//     }, [availableBase]);

//     const toLocationLabel = toLocation === "pastry" ? "кондитерскую" : "кафе";

//     // Подгружаем категории получателя при открытии
//     useEffect(() => {
//         if (!open) return;
//         let cancelled = false;
//         (async () => {
//             try {
//                 const cats = await getProductCategories({
//                     location: toLocation,
//                 });
//                 if (!cancelled) {
//                     setTargetCategories(Array.isArray(cats) ? cats : []);
//                 }
//             } catch (e) {
//                 if (!cancelled) setTargetCategories([]);
//             }
//         })();
//         return () => {
//             cancelled = true;
//         };
//     }, [open, toLocation]);

//     // Сброс при закрытии
//     useEffect(() => {
//         if (!open) {
//             setInputUnit(baseUnit);
//             setQuantity("");
//             setReason("");
//             setTargetCategoryId("");
//         }
//     }, [open, baseUnit]);

//     const qtyNumber = useMemo(() => Number(quantity), [quantity]);
//     const isQtyValid = Number.isFinite(qtyNumber) && qtyNumber > 0;

//     // Пересчёт в базовые единицы для валидации
//     const qtyBase = useMemo(() => {
//         if (!isQtyValid) return 0;
//         if (inputUnit === "шт") {
//             if (!pieceToBase || !Number.isFinite(Number(pieceToBase))) return 0;
//             return qtyNumber * Number(pieceToBase);
//         }
//         try {
//             return toBase({
//                 unit: inputUnit,
//                 qty: qtyNumber,
//                 pieceToBase: null,
//             });
//         } catch {
//             return 0;
//         }
//     }, [isQtyValid, qtyNumber, inputUnit, pieceToBase]);

//     const isEnough = qtyBase > 0 ? qtyBase <= available : true;

//     const errorText = useMemo(() => {
//         if (!quantity) return null;
//         if (!Number.isFinite(qtyNumber)) return "Введите число";
//         if (qtyNumber <= 0) return "Количество должно быть больше 0";
//         if (inputUnit === "шт" && !pieceToBase) {
//             return "Для этого продукта не указан коэффициент шт → база";
//         }
//         if (qtyBase > available) {
//             return `Недостаточно на складе. Доступно: ${format3(
//                 available
//             )} ${baseUnit} (вы пытаетесь переместить ${format3(qtyBase)} ${baseUnit})`;
//         }
//         return null;
//     }, [
//         quantity,
//         qtyNumber,
//         qtyBase,
//         available,
//         baseUnit,
//         inputUnit,
//         pieceToBase,
//     ]);

//     function close() {
//         onOpenChange(false);
//     }

//     function fillMax() {
//         // Заполняем в текущей единице ввода — пересчёт обратно из base
//         if (inputUnit === baseUnit) {
//             setQuantity(String(available));
//             return;
//         }
//         if (inputUnit === "кг" && baseUnit === "г") {
//             setQuantity(String(available / 1000));
//             return;
//         }
//         if (inputUnit === "л" && baseUnit === "мл") {
//             setQuantity(String(available / 1000));
//             return;
//         }
//         if (inputUnit === "шт" && pieceToBase && Number(pieceToBase) > 0) {
//             setQuantity(String(available / Number(pieceToBase)));
//             return;
//         }
//         setQuantity(String(available));
//     }

//     function onSubmit() {
//         if (!isQtyValid) {
//             toast.error("Введите корректное количество");
//             return;
//         }
//         if (qtyBase <= 0) {
//             toast.error("Не удалось пересчитать количество");
//             return;
//         }
//         if (!isEnough) {
//             toast.error(
//                 `Недостаточно на складе: доступно ${format3(
//                     available
//                 )} ${baseUnit}`
//             );
//             return;
//         }

//         startTransition(async () => {
//             try {
//                 await transferProduct({
//                     fromLocation,
//                     toLocation,
//                     productId,
//                     quantityBase: qtyBase,
//                     targetCategoryId: targetCategoryId || undefined,
//                     reason: reason.trim() || undefined,
//                 });
//                 toast.success(`Перемещено в ${toLocationLabel}`);
//                 router.refresh();
//                 close();
//             } catch (e) {
//                 const message =
//                     e instanceof Error ? e.message : "Ошибка перемещения";
//                 toast.error(message);
//             }
//         });
//     }

//     return (
//         <Dialog
//             open={open}
//             onOpenChange={(next) => (next ? onOpenChange(true) : close())}
//         >
//             <DialogContent>
//                 <DialogHeader>
//                     <DialogTitle>
//                         Переместить в {toLocationLabel}
//                         {productName ? ` — ${productName}` : ""}
//                     </DialogTitle>

//                     <DialogDescription>
//                         Доступно:{" "}
//                         <span className="font-medium">
//                             {format3(available)} {baseUnit}
//                         </span>
//                         . Перемещение по FIFO.
//                     </DialogDescription>
//                 </DialogHeader>

//                 <div className="space-y-4">
//                     <div className="space-y-2">
//                         <Label>Единица ввода</Label>
//                         <div className="flex gap-1 flex-wrap">
//                             {availableUnits.map((u) => (
//                                 <Button
//                                     type="button"
//                                     key={u}
//                                     variant={
//                                         inputUnit === u ? "default" : "outline"
//                                     }
//                                     onClick={() => setInputUnit(u)}
//                                 >
//                                     {u}
//                                 </Button>
//                             ))}
//                         </div>
//                     </div>

//                     <div className="space-y-2">
//                         <div className="flex items-end justify-between gap-2">
//                             <Label htmlFor="qty-transfer">
//                                 Количество (в {inputUnit})
//                             </Label>
//                             <Button
//                                 type="button"
//                                 variant="outline"
//                                 size="sm"
//                                 onClick={fillMax}
//                                 disabled={isPending || available <= 0}
//                             >
//                                 Переместить всё
//                             </Button>
//                         </div>

//                         <Input
//                             id="qty-transfer"
//                             inputMode="decimal"
//                             value={quantity}
//                             onChange={(e) => setQuantity(e.target.value)}
//                         />

//                         {errorText && (
//                             <div className="text-sm text-destructive">
//                                 {errorText}
//                             </div>
//                         )}

//                         {isQtyValid && qtyBase > 0 && !errorText && (
//                             <div className="text-xs text-muted-foreground">
//                                 Будет перемещено: {format3(qtyBase)} {baseUnit}
//                             </div>
//                         )}
//                     </div>

//                     <div className="space-y-2">
//                         <Label htmlFor="cat-target">
//                             Категория в получателе (если продукта там ещё нет)
//                         </Label>
//                         <select
//                             id="cat-target"
//                             className="w-full h-10 rounded-md border bg-background px-3 text-sm"
//                             value={targetCategoryId}
//                             onChange={(e) =>
//                                 setTargetCategoryId(e.target.value)
//                             }
//                             disabled={isPending}
//                         >
//                             <option value="">— не выбрана —</option>
//                             {targetCategories.map((c) => (
//                                 <option key={c.id} value={c.id}>
//                                     {c.name}
//                                 </option>
//                             ))}
//                         </select>
//                         <div className="text-xs text-muted-foreground">
//                             Если такой продукт уже есть в {toLocationLabel} — это
//                             поле игнорируется.
//                         </div>
//                     </div>

//                     <div className="space-y-2">
//                         <Label htmlFor="reason-transfer">
//                             Причина (необязательно)
//                         </Label>
//                         <Textarea
//                             id="reason-transfer"
//                             value={reason}
//                             onChange={(e) => setReason(e.target.value)}
//                             placeholder="Например: передача на производство"
//                         />
//                     </div>

//                     <Button
//                         onClick={onSubmit}
//                         disabled={
//                             isPending ||
//                             !isQtyValid ||
//                             !isEnough ||
//                             available <= 0
//                         }
//                         className="w-full"
//                     >
//                         {isPending
//                             ? "Перемещаю..."
//                             : `Переместить в ${toLocationLabel}`}
//                     </Button>

//                     <div className="flex justify-center">
//                         <Button variant="ghost" onClick={close}>
//                             Отмена
//                         </Button>
//                     </div>
//                 </div>
//             </DialogContent>
//         </Dialog>
//     );
// }


"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { transferProduct } from "@/actions/stock/products/transferProduct";
import { getProductCategories } from "@/actions/stock/categories/getProductCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { toBase, fromBase } from "@/lib/helpers/units";
import {
    INPUT_UNITS,
    UNIT_LABELS,
    UNIT_TO_MEASURE,
} from "@/lib/constants/units";
import { LOCATION_LABELS } from "@/lib/constants/labels";

const format3 = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(3) : "0.000";
};

// Какие input-единицы доступны для данной меры продукта
function inputUnitsForMeasure(measure) {
    return INPUT_UNITS.filter((u) => {
        if (u === "pcs") return true; // штуки доступны всем (если задан pieceToBase)
        return UNIT_TO_MEASURE[u] === measure;
    });
}

export default function TransferProductDialog({
    open,
    onOpenChange,
    fromLocation,
    toLocation,
    productId,
    productName,
    baseUnit,        // "g" | "ml"  (enum БД)
    measure,         // "mass" | "volume" | "piece"
    pieceToBase,     // number | string | null
    availableBase,   // number | string  (в базовой единице)
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const availableUnits = useMemo(() => inputUnitsForMeasure(measure), [measure]);
    const pieceToBaseNum = useMemo(() => {
        const n = Number(pieceToBase);
        return Number.isFinite(n) && n > 0 ? n : null;
    }, [pieceToBase]);

    const [inputUnit, setInputUnit] = useState(baseUnit);
    const [quantity, setQuantity] = useState("");
    const [reason, setReason] = useState("");

    const [targetCategories, setTargetCategories] = useState([]);
    const [targetCategoryId, setTargetCategoryId] = useState("");

    const available = useMemo(() => {
        const n = Number(availableBase);
        return Number.isFinite(n) ? n : 0;
    }, [availableBase]);

    const toLocationLabel = LOCATION_LABELS[toLocation] ?? toLocation;

    // Категории получателя (учитываем формат withAction → { ok, data })
    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        (async () => {
            const res = await getProductCategories({ location: toLocation });
            if (cancelled) return;
            setTargetCategories(
                res?.ok && Array.isArray(res.data) ? res.data : [],
            );
        })();
        return () => {
            cancelled = true;
        };
    }, [open, toLocation]);

    // Сброс при закрытии
    useEffect(() => {
        if (!open) {
            setInputUnit(baseUnit);
            setQuantity("");
            setReason("");
            setTargetCategoryId("");
        }
    }, [open, baseUnit]);

    const qtyNumber = useMemo(() => Number(quantity), [quantity]);
    const isQtyValid = Number.isFinite(qtyNumber) && qtyNumber > 0;

    // qty → base через единый хелпер
    const qtyBase = useMemo(() => {
        if (!isQtyValid) return 0;
        try {
            return toBase({
                unit: inputUnit,
                qty: qtyNumber,
                pieceToBase: pieceToBaseNum,
            });
        } catch {
            return 0;
        }
    }, [isQtyValid, qtyNumber, inputUnit, pieceToBaseNum]);

    const isEnough = qtyBase > 0 ? qtyBase <= available + 1e-6 : true;

    const errorText = useMemo(() => {
        if (!quantity) return null;
        if (!Number.isFinite(qtyNumber)) return "Введите число";
        if (qtyNumber <= 0) return "Количество должно быть больше 0";
        if (inputUnit === "pcs" && !pieceToBaseNum) {
            return "Для этого продукта не указан коэффициент шт → база";
        }
        if (qtyBase > available + 1e-6) {
            return `Недостаточно: доступно ${format3(available)} ${UNIT_LABELS[baseUnit]} (переместить хотите ${format3(qtyBase)} ${UNIT_LABELS[baseUnit]})`;
        }
        return null;
    }, [quantity, qtyNumber, qtyBase, available, baseUnit, inputUnit, pieceToBaseNum]);

    function close() {
        onOpenChange(false);
    }

    // «Переместить всё» — через fromBase в текущей единице ввода
    function fillMax() {
        if (available <= 0) return;
        if (inputUnit === "pcs" && !pieceToBaseNum) {
            setQuantity(String(available));
            return;
        }
        const inUnit = fromBase({
            unit: inputUnit,
            qtyBase: available,
            pieceToBase: pieceToBaseNum,
        });
        // обрезаем хвосты, но не теряем точность
        setQuantity(String(Number(inUnit.toFixed(6))));
    }

    function onSubmit() {
        if (!isQtyValid || qtyBase <= 0) {
            toast.error("Введите корректное количество");
            return;
        }
        if (!isEnough) {
            toast.error(
                `Недостаточно: ${format3(available)} ${UNIT_LABELS[baseUnit]}`,
            );
            return;
        }

        startTransition(async () => {
            const res = await transferProduct({
                fromLocation,
                toLocation,
                productId,
                quantityBase: qtyBase,
                targetCategoryId: targetCategoryId || undefined,
                reason: reason.trim() || undefined,
            });

            if (!res?.ok) {
                toast.error(res?.error || "Ошибка перемещения");
                return;
            }

            toast.success(`Перемещено в ${toLocationLabel}`);
            router.refresh();
            close();
        });
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => (next ? onOpenChange(true) : close())}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Переместить в {toLocationLabel}
                        {productName ? ` — ${productName}` : ""}
                    </DialogTitle>
                    <DialogDescription>
                        Доступно:{" "}
                        <span className="font-medium">
                            {format3(available)} {UNIT_LABELS[baseUnit]}
                        </span>
                        . Перемещение по FIFO.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Единица ввода */}
                    <div className="space-y-2">
                        <Label>Единица ввода</Label>
                        <div className="flex gap-1 flex-wrap">
                            {availableUnits.map((u) => (
                                <Button
                                    type="button"
                                    key={u}
                                    variant={inputUnit === u ? "default" : "outline"}
                                    onClick={() => setInputUnit(u)}
                                    disabled={u === "pcs" && !pieceToBaseNum}
                                    title={
                                        u === "pcs" && !pieceToBaseNum
                                            ? "Не задан pieceToBase у продукта"
                                            : undefined
                                    }
                                >
                                    {UNIT_LABELS[u]}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Количество */}
                    <div className="space-y-2">
                        <div className="flex items-end justify-between gap-2">
                            <Label htmlFor="qty-transfer">
                                Количество (в {UNIT_LABELS[inputUnit]})
                            </Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={fillMax}
                                disabled={isPending || available <= 0}
                            >
                                Переместить всё
                            </Button>
                        </div>

                        <Input
                            id="qty-transfer"
                            inputMode="decimal"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                        />

                        {errorText && (
                            <div className="text-sm text-destructive">{errorText}</div>
                        )}

                        {isQtyValid && qtyBase > 0 && !errorText && (
                            <div className="text-xs text-muted-foreground">
                                Будет перемещено: {format3(qtyBase)} {UNIT_LABELS[baseUnit]}
                            </div>
                        )}
                    </div>

                    {/* Категория получателя */}
                    <div className="space-y-2">
                        <Label htmlFor="cat-target">
                            Категория в получателе{" "}
                            <span className="text-muted-foreground font-normal">
                                (нужна, если продукта там ещё нет)
                            </span>
                        </Label>
                        <select
                            id="cat-target"
                            className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                            value={targetCategoryId}
                            onChange={(e) => setTargetCategoryId(e.target.value)}
                            disabled={isPending}
                        >
                            <option value="">— автоматически по имени —</option>
                            {targetCategories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Причина */}
                    <div className="space-y-2">
                        <Label htmlFor="reason-transfer">Причина (необязательно)</Label>
                        <Textarea
                            id="reason-transfer"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Например: передача на производство"
                        />
                    </div>

                    <Button
                        onClick={onSubmit}
                        disabled={
                            isPending || !isQtyValid || !isEnough || available <= 0
                        }
                        className="w-full"
                    >
                        {isPending ? "Перемещаю..." : `Переместить в ${toLocationLabel}`}
                    </Button>

                    <div className="flex justify-center">
                        <Button variant="ghost" onClick={close}>
                            Отмена
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}