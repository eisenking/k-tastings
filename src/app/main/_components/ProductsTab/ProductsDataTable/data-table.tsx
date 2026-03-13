"use client";
import { useState } from "react";
import {
	type ColumnDef,
	type ColumnFiltersState,
	type SortingState,
	type VisibilityState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DataTablePagination } from "./DataTablePagination";
import AddProductDialog from "../AddProductDialog";
import AddProductDialogControlled from "../AddProductDialogControlled";

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
}

export function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = useState({});

	const [openAdd, setOpenAdd] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState<any>(null);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onColumnFiltersChange: setColumnFilters,
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
		},
		initialState: {
			pagination: {
				pageSize: 50,
			},
		},

		meta: {
			onQuickAdd: (row: any) => {
				setSelectedProduct({
					id: row.id,
					name: row.name,
					category: row.category,
					baseUnit: row.baseUnit,
				});
				setOpenAdd(true);
			},
		},

	});

	const categoryColumn = table.getColumn("category");

	const uniqueCategories = categoryColumn
		? Array.from(
				new Set(
					table
						.getPreFilteredRowModel()
						.rows.map((row) => row.getValue("category"))
				)
			).filter(Boolean)
		: [];

	const selectedCategories = (categoryColumn?.getFilterValue() as string[]) || [];

	return (
		<div>
			<div className="flex justify-center items-center">
				<AddProductDialog />
			</div>
			
			<AddProductDialogControlled
				open={openAdd}
				onOpenChange={setOpenAdd}
				title={selectedProduct ? `Приход: ${selectedProduct.name}` : "Приход на склад"}
				initialProduct={selectedProduct}
			/>

			<div className="flex items-center py-2">
				<Input
					placeholder="Поиск по названию"
					value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
					onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
					className="max-w-sm"
				/>

				<div className="ml-auto flex items-center space-x-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" className="flex items-center gap-1">
								Категория {selectedCategories.length > 0 && `(${selectedCategories.length})`}
							</Button>
						</DropdownMenuTrigger>

						<DropdownMenuContent align="end" className="w-56">
							<DropdownMenuLabel>Фильтр по категории</DropdownMenuLabel>
							<DropdownMenuSeparator />

							<DropdownMenuItem
								onClick={() => categoryColumn?.setFilterValue(undefined)}
								className="justify-center"
							>
								Очистить фильтр
							</DropdownMenuItem>

							<DropdownMenuSeparator />

							{uniqueCategories.map((cat) => (
								<DropdownMenuCheckboxItem
									key={String(cat)}
									checked={selectedCategories.includes(String(cat))}
									onCheckedChange={(checked) => {
										if (checked) {
											categoryColumn?.setFilterValue([...selectedCategories, String(cat)]);
										} else {
											categoryColumn?.setFilterValue(
												selectedCategories.filter((t) => t !== String(cat))
											);
										}
									}}
								>
									{String(cat)}
								</DropdownMenuCheckboxItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline">Столбцы</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{table
								.getAllColumns()
								.filter((column) => column.getCanHide())
								.map((column) => (
									<DropdownMenuCheckboxItem
										key={column.id}
										className="capitalize"
										checked={column.getIsVisible()}
										onCheckedChange={(value) => column.toggleVisibility(!!value)}
									>
										{column.id}
									</DropdownMenuCheckboxItem>
								))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(header.column.columnDef.header, header.getContext())}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>

					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={columns.length} className="h-24 text-center">
									Нет результатов.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>

				<DataTablePagination table={table} />
			</div>
		</div>
	);
}