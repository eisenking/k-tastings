"use client";

import { useMemo, useState, useTransition } from "react";
import { writeOffFifo } from "@/app/actions/products/writeOffFifo";
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

type Props = {
	open: boolean;
	onOpenChange: (next: boolean) => void;

	productId: string;
	productName?: string;

	baseUnit: string;
	availableBase: number; // доступный остаток в baseUnit
};

export default function WriteOffDialogControlled({
	open,
	onOpenChange,
	productId,
	productName,
	baseUnit,
	availableBase,
}: Props) {
	const [quantityBase, setQuantityBase] = useState<string>("");
	const [reason, setReason] = useState<string>("");
	const [result, setResult] = useState<null | {
		writtenOffBase: number;
		allocations: Array<{
			batchId: string;
			variantId: string;
			variantName: string;
			unit: string;
			quantity: number;
			quantityBase: number;
			purchasePrice: number | null;
		}>;
	}>(null);

	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const qtyNumber = useMemo(() => Number(quantityBase), [quantityBase]);
	const isQtyValid = Number.isFinite(qtyNumber) && qtyNumber > 0;

	const available = useMemo(() => {
		const n = Number(availableBase);
		return Number.isFinite(n) ? n : 0;
	}, [availableBase]);

	const isEnough = isQtyValid ? qtyNumber <= available : true;

	const errorText = useMemo(() => {
		if (!quantityBase) return null;
		if (!Number.isFinite(qtyNumber)) return "Введите число";
		if (qtyNumber <= 0) return "Количество должно быть больше 0";
		if (qtyNumber > available) {
			return `Недостаточно на складе. Доступно: ${available.toFixed(3)} ${baseUnit}`;
		}
		return null;
	}, [quantityBase, qtyNumber, available, baseUnit]);

	function resetForm() {
		setQuantityBase("");
		setReason("");
		setResult(null);
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
			toast.error(`Недостаточно на складе: доступно ${available.toFixed(3)} ${baseUnit}`);
			return;
		}

		startTransition(async () => {
			try {
				const res = await writeOffFifo({
					productId,
					quantityBase: qtyNumber,
					reason: reason.trim() ? reason.trim() : undefined,
				});

				setResult({
					writtenOffBase: res.writtenOffBase,
					allocations: res.allocations,
				});

				toast.success("Списание выполнено (FIFO)");
				router.refresh();
			} catch (e) {
				const message = e instanceof Error ? e.message : "Ошибка списания";
				toast.error(message);
			}
		});
	}

	return (
		<Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						Списание (FIFO){productName ? ` — ${productName}` : ""}
					</DialogTitle>
					<DialogDescription>
						Доступно: <span className="font-medium">{available.toFixed(3)} {baseUnit}</span>. Списание будет выполнено по партиям FIFO.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<div className="flex items-end justify-between gap-2">
							<Label htmlFor="qty">Количество (в {baseUnit})</Label>
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
							placeholder={`Например: 5 (${baseUnit})`}
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
					</div>

					<Button
						onClick={onSubmit}
						disabled={isPending || !isQtyValid || !isEnough || available <= 0}
						className="w-full"
					>
						{isPending ? "Списываю..." : "Списать по FIFO"}
					</Button>

					{result && (
						<div className="rounded-md border p-3">
							<div className="text-sm font-medium">
								Разложение FIFO: {result.writtenOffBase.toFixed(3)} {baseUnit}
							</div>

							<div className="mt-2 space-y-2 text-sm">
								{result.allocations.map((a) => (
									<div
										key={`${a.batchId}-${a.variantId}`}
										className="flex items-center justify-between gap-4"
									>
										<div className="min-w-0">
											<div className="truncate">
												{a.variantName} • партия {a.batchId.slice(0, 8)}
											</div>
											<div className="text-xs text-muted-foreground">
												{a.purchasePrice != null
													? `закуп: ${a.purchasePrice} руб./${a.unit}`
													: "закуп: —"}
											</div>
										</div>

										<div className="whitespace-nowrap text-right">
											<div>
												{a.quantity.toFixed(3)} {a.unit}
											</div>
											<div className="text-xs text-muted-foreground">
												{a.quantityBase.toFixed(3)} {baseUnit}
											</div>
										</div>
									</div>
								))}
							</div>

							<div className="mt-3 flex gap-2">
								<Button variant="outline" className="w-full" onClick={close}>
									Закрыть
								</Button>
								<Button variant="secondary" className="w-full" onClick={resetForm}>
									Новое списание
								</Button>
							</div>
						</div>
					)}

					<div className="flex justify-end">
						<Button variant="ghost" onClick={close}>
							Отмена
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}