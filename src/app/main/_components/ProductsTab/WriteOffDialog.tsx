"use client";

import { useMemo, useState, useTransition } from "react";
import { writeOffFifo } from "@/app/actions/products/writeOffFifo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Props = {
	productId: string;
	baseUnit: string;
	productName?: string;
};

export default function WriteOffDialog({ productId, baseUnit, productName }: Props) {
	const [open, setOpen] = useState(false);
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

	function resetForm() {
		setQuantityBase("");
		setReason("");
		setResult(null);
	}

	function onSubmit() {
		if (!isQtyValid) {
			toast.error("Введите корректное количество");
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

	function onOpenChange(next: boolean) {
		setOpen(next);
		if (!next) resetForm();
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>
				<Button variant="ghost" className="w-full justify-start px-2"  onClick={(e) => {e.stopPropagation();}}>
					Списание/Выдача
				</Button>
			</DialogTrigger>

			<DialogContent
            onInteractOutside={(e) => e.preventDefault()}
	        onPointerDownOutside={(e) => e.preventDefault()}
	        onFocusOutside={(e) => e.preventDefault()}
            >
				<DialogHeader>
					<DialogTitle>
						Списание (FIFO){productName ? ` — ${productName}` : ""}
					</DialogTitle>
                    <DialogDescription>
		                Введите количество в базовой единице ({baseUnit}). Списание выполняется по FIFO.
	                </DialogDescription>    
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="qty">Количество (в {baseUnit})</Label>
						<Input
							id="qty"
							inputMode="decimal"
							value={quantityBase}
							onChange={(e) => setQuantityBase(e.target.value)}
							placeholder={`Например: 5 (${baseUnit})`}
						/>
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

					<Button onClick={onSubmit} disabled={isPending || !isQtyValid} className="w-full">
						{isPending ? "Списываю..." : "Списать по FIFO"}
					</Button>

					{result && (
						<div className="rounded-md border p-3">
							<div className="text-sm font-medium">
								Разложение FIFO: {result.writtenOffBase.toFixed(3)} {baseUnit}
							</div>

							<div className="mt-2 space-y-2 text-sm">
								{result.allocations.map((a) => (
									<div key={`${a.batchId}-${a.variantId}`} className="flex items-center justify-between gap-4">
										<div className="min-w-0">
											<div className="truncate">
												{a.variantName} • партия {a.batchId.slice(0, 8)}
											</div>
											<div className="text-xs text-muted-foreground">
												{a.purchasePrice != null ? `закуп: ${a.purchasePrice} руб./${a.unit}` : "закуп: —"}
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
								<Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
									Закрыть
								</Button>
								<Button variant="secondary" className="w-full" onClick={resetForm}>
									Новое списание
								</Button>
							</div>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
