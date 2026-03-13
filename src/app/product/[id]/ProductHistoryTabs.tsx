"use client";

import { ProductHistory } from "@/app/actions/products/getProductHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Props = {
	data: ProductHistory;
};

function formatDate(d: Date | string | null) {
	if (!d) return "—";
	const date = typeof d === "string" ? new Date(d) : d;
	return new Intl.DateTimeFormat("ru-RU", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
}

const format3 = (v: number) => {
	const n = Number(v);
	if (!Number.isFinite(n)) return "0.000";
	return n.toFixed(3);
};

const formatRub = (v: number) => {
	const n = Number(v);
	if (!Number.isFinite(n)) return "0.00";
	return n.toFixed(2);
};

export default function ProductHistoryTabs({ data }: Props) {
	return (
		<Tabs defaultValue="movements" className="w-full">
			<TabsList>
				<TabsTrigger value="movements">Движения</TabsTrigger>
				<TabsTrigger value="batches">Партии</TabsTrigger>
				<TabsTrigger value="prices">Цены</TabsTrigger>
			</TabsList>

			{/* MOVEMENTS */}
			<TabsContent value="movements" className="mt-4">
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Дата</TableHead>
								<TableHead>Тип</TableHead>
								<TableHead>Партия</TableHead>
								<TableHead className="text-right">Кол-во (base)</TableHead>
								<TableHead className="text-right">Стоимость</TableHead>
								<TableHead>Причина</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							{data.movements.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6} className="h-24 text-center">
										Нет движений
									</TableCell>
								</TableRow>
							) : (
								data.movements.map((m) => (
									<TableRow key={m.id}>
										<TableCell className="whitespace-nowrap">{formatDate(m.createdAt)}</TableCell>

										<TableCell>
											<Badge variant={m.type === "Приход" ? "default" : "secondary"}>
												{m.type}
											</Badge>
										</TableCell>

										<TableCell className="whitespace-nowrap">
											{m.batchId ? String(m.batchId).slice(0, 8) : "—"}
										</TableCell>

										<TableCell className="text-right tabular-nums">
											{format3(m.amountBase)} {data.product.baseUnit}
										</TableCell>

										<TableCell className="text-right tabular-nums">
											{m.cost != null ? `${formatRub(m.cost)} руб.` : "—"}
										</TableCell>

										<TableCell className="max-w-65 truncate">{m.reason ?? "—"}</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</TabsContent>

			{/* BATCHES */}
			<TabsContent value="batches" className="mt-4">
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Партия</TableHead>
								<TableHead>Создана</TableHead>
								<TableHead>Годен до</TableHead>
								<TableHead className="text-right">Приход (base)</TableHead>
								<TableHead className="text-right">Остаток (base)</TableHead>
								<TableHead className="text-right">Себестоимость</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							{data.batches.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6} className="h-24 text-center">
										Партий нет
									</TableCell>
								</TableRow>
							) : (
								data.batches.map((b) => (
									<TableRow key={b.batchId}>
										<TableCell className="whitespace-nowrap">
											{String(b.batchId).slice(0, 8)}
										</TableCell>

										<TableCell className="whitespace-nowrap">{formatDate(b.createdAt)}</TableCell>

										<TableCell className="whitespace-nowrap">
											{formatDate(b.expirationDate)}
										</TableCell>

										<TableCell className="text-right tabular-nums">
											{format3(b.receivedBase)} {data.product.baseUnit}
										</TableCell>

										<TableCell className="text-right tabular-nums">
											{format3(b.remainingBase)} {data.product.baseUnit}
										</TableCell>

										<TableCell className="text-right tabular-nums">
											{b.unitCostBase != null
												? `${formatRub(b.unitCostBase)} руб./${data.product.baseUnit}`
												: "—"}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</TabsContent>

			{/* PRICES */}
			<TabsContent value="prices" className="mt-4">
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Дата</TableHead>
								<TableHead className="text-right">Цена</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							{data.priceHistory.length === 0 ? (
								<TableRow>
									<TableCell colSpan={2} className="h-24 text-center">
										Истории цен нет
									</TableCell>
								</TableRow>
							) : (
								data.priceHistory.map((p) => (
									<TableRow key={p.id}>
										<TableCell className="whitespace-nowrap">{formatDate(p.validFrom)}</TableCell>
										<TableCell className="text-right tabular-nums">{formatRub(p.price)} руб.</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</TabsContent>
		</Tabs>
	);
}