"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon, XIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { addProduct } from "@/app/actions/products/addProduct";
import { getProductSuggestions } from "@/app/actions/products/getProductSuggestions";
import ExpirationDatePicker from "./ExpirationDatePicker";

const PRODUCT_CATEGORY = ["Молочные", "Сухие", "Жиры", "Фрукты/Ягоды", "Орехи", "Шоколад", "Добавки", "Прочее",];

const INPUT_UNITS = ["г", "кг", "мл", "л", "шт"];

const schema = z.object({
	productId: z.string().optional(),
	name: z.string().min(1, "Введите название"),
	category: z.enum(PRODUCT_CATEGORY),
	inputUnit: z.enum(INPUT_UNITS),
	quantity: z.coerce.number().positive("Количество должно быть > 0"),
	totalCost: z.coerce.number().min(0, "Стоимость не может быть < 0"),
	expirationDate: z.string().optional(),
	measure: z.enum(["mass", "volume"]).optional(),
	pieceToBase: z.coerce.number().optional(),
});

export default function AddProductDialog() {
	const router = useRouter();
	const [open, setOpen] = useState(false);
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
			category: "",
			inputUnit: "г",
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
	const category = watch("category");
	const expirationDate = watch("expirationDate");

	const isLocked = !!watchProductId;

	const resetSelection = () => {
		setValue("productId", "");
		setSuggestions([]);
	};

	useEffect(() => {
		if (watchProductId) {
			setSuggestions([]);
			return;
		}

		if (!watchName || watchName.length < 2) {
			setSuggestions([]);
			return;
		}

		let cancelled = false;

		(async () => {
			const res = await getProductSuggestions(watchName);

			if (cancelled) return;
			if (pickingRef.current) return;
			if (watch("productId")) return;

			setSuggestions(Array.isArray(res) ? res : []);
		})();

		return () => {
			cancelled = true;
		};
	}, [watchName, watchProductId, watch]);

	useEffect(() => {
		if (inputUnit === "г" || inputUnit === "кг") setValue("measure", "mass");
		if (inputUnit === "мл" || inputUnit === "л") setValue("measure", "volume");
	}, [inputUnit, setValue]);

	const onSubmit = async (data) => {
		try {
			await addProduct({
				productId: data.productId || null,
				name: data.name,
				category: data.category,

				inputUnit: data.inputUnit,
				quantity: Number(data.quantity),
				totalCost: Number(data.totalCost),

				measure: data.measure ?? "mass",
				pieceToBase: data.inputUnit === "шт" ? Number(data.pieceToBase) : null,

				expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
			});

			toast.success("Продукт добавлен");

			reset({
				productId: "",
				name: "",
				category: "",
				inputUnit: "г",
				quantity: "",
				totalCost: "",
				expirationDate: "",
				measure: "mass",
				pieceToBase: "",
			});

			setSuggestions([]);
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
					<div className="relative">
						<Input
							{...register("name", {
								onChange: () => {
									if (pickingRef.current) return;
									if (watch("productId")) setValue("productId", "");
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
											setValue("category", p.category);
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
												{p.category} • база: {p.baseUnit}
											</span>
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					<div>
						<Label className="mb-1">Категория</Label>
						<div className="flex gap-1 flex-wrap">
							{PRODUCT_CATEGORY.map((c) => (
								<Button
									type="button"
									key={c}
									variant={category === c ? "default" : "outline"}
									disabled={isLocked && category !== c}
									onClick={() => {
										if (isLocked) return;
										setValue("category", c);
									}}
								>
									{c}
								</Button>
							))}
						</div>
						{isLocked && (
							<p className="text-xs text-muted-foreground mt-2">
								Категория зафиксирована выбранным товаром. Сбросьте выбор (крестик),
								чтобы изменить.
							</p>
						)}
					</div>

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
									{u}
								</Button>
							))}
						</div>
						{isLocked && (
							<p className="text-xs text-muted-foreground mt-2">
								Единица ввода зафиксирована выбранным товаром. Сбросьте выбор (крестик),
								чтобы изменить.
							</p>
						)}
					</div>

					{inputUnit === "шт" && (
						<div className="space-y-3">
							<div>
								<Label className="mb-1">Что это по базе?</Label>
								<div className="flex gap-1">
									<Button
										type="button"
										variant={measure === "mass" ? "default" : "outline"}
										onClick={() => setValue("measure", "mass")}
									>
										Масса (г)
									</Button>
									<Button
										type="button"
										variant={measure === "volume" ? "default" : "outline"}
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
							/>
						</div>
					)}
					
					<Label className="mb-1">Количество</Label>
					<Input
						type="number"
						{...register("quantity")}
						placeholder="Количество"
					/>

					<Label className="mb-1">Стоимость</Label>
					<Input
						type="number"
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