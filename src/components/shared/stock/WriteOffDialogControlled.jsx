"use client";
import { useMemo, useState, useTransition } from "react";
import { writeOffFifo } from "@/actions/stock/products/writeOffFifo";
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

const format3 = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return "0.000";
    return n.toFixed(3);
};

/**
 * @param {{
 *   open: boolean,
 *   onOpenChange: (v: boolean) => void,
 *   location: "pastry" | "cafe",
 *   productId: string,
 *   productName: string,
 *   baseUnit: "г" | "мл",
 *   availableBase: number,
 * }} props
 */
export default function WriteOffDialogControlled({
    open,
    onOpenChange,
    location,
    productId,
    productName,
    baseUnit,
    availableBase,
}) {
    const [quantityBase, setQuantityBase] = useState("");
    const [reason, setReason] = useState("");

    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const qtyNumber = useMemo(() => Number(quantityBase), [quantityBase]);
    const isQtyValid = Number.isFinite(qtyNumber) && qtyNumber > 0;

    const available = useMemo(() => {
        const n = Number(availableBase);
        return Number.isFinite(n) ? n : 0;
    }, [availableBase]);

    const isEnough = isQtyValid ? qtyNumber <= available : true;

    const reasonTrimmed = useMemo(() => reason.trim(), [reason]);
    const isReasonValid = reasonTrimmed.length > 0;

    const errorText = useMemo(() => {
        if (!quantityBase) return null;
        if (!Number.isFinite(qtyNumber)) return "Введите число";
        if (qtyNumber <= 0) return "Количество должно быть больше 0";
        if (qtyNumber > available) {
            return `Недостаточно на складе. Доступно: ${format3(available)} ${baseUnit}`;
        }
        return null;
    }, [quantityBase, qtyNumber, available, baseUnit]);

    const reasonErrorText = useMemo(() => {
        if (!reason) return null;
        if (!isReasonValid) return "Укажите причину";
        return null;
    }, [reason, isReasonValid]);

    function resetForm() {
        setQuantityBase("");
        setReason("");
    }

    function close() {
        onOpenChange(false);
        resetForm();
    }

    function fillMax() {
        setQuantityBase(String(available));
    }

    function onSubmit() {
        if (!isQtyValid) {
            toast.error("Введите корректное количество");
            return;
        }
        if (!isEnough) {
            toast.error(
                `Недостаточно на складе: доступно ${format3(available)} ${baseUnit}`
            );
            return;
        }
        if (!isReasonValid) {
            toast.error("Укажите причину списания");
            return;
        }

        startTransition(async () => {
            try {
                await writeOffFifo({
                    location,
                    productId,
                    quantityBase: qtyNumber,
                    reason: reasonTrimmed,
                });
                toast.success("Списание выполнено");
                router.refresh();
                close();
            } catch (e) {
                const message =
                    e instanceof Error ? e.message : "Ошибка списания";
                toast.error(message);
            }
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
                        Списание (FIFO)
                        {productName ? ` — ${productName}` : ""}
                    </DialogTitle>

                    <DialogDescription>
                        Доступно:{" "}
                        <span className="font-medium">
                            {format3(available)} {baseUnit}
                        </span>
                        . Списание будет выполнено по партиям FIFO.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-end justify-between gap-2">
                            <Label htmlFor="qty">
                                Количество (в {baseUnit})
                            </Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={fillMax}
                                disabled={isPending || available <= 0}
                            >
                                Списать всё
                            </Button>
                        </div>

                        <Input
                            id="qty"
                            inputMode="decimal"
                            value={quantityBase}
                            onChange={(e) => setQuantityBase(e.target.value)}
                            placeholder=""
                        />

                        {errorText && (
                            <div className="text-sm text-destructive">
                                {errorText}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reason">Причина</Label>
                        <Textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Например: выдача в цех / списание по браку"
                        />
                        {reasonErrorText && (
                            <div className="text-sm text-destructive">
                                {reasonErrorText}
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={onSubmit}
                        disabled={
                            isPending ||
                            !isQtyValid ||
                            !isEnough ||
                            available <= 0 ||
                            !isReasonValid
                        }
                        className="w-full"
                    >
                        {isPending ? "Списываю..." : "Списать по FIFO"}
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