"use client";

import { useState } from "react";
import Link from "next/link";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import WriteOffDialogControlled from "./WriteOffDialogControlled";
import type { Products } from "./columns";

type Props = {
	row: Products;
};

export default function ProductActionsCell({ row }: Props) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" className="h-8 w-8 p-0">
						<span className="sr-only">Open menu</span>
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>

				<DropdownMenuContent align="end">
					<DropdownMenuLabel>Действия</DropdownMenuLabel>

					<Link href={`/product/${row.id}`}>
						<DropdownMenuItem>История</DropdownMenuItem>
					</Link>

					<DropdownMenuSeparator />

					<DropdownMenuItem
						onSelect={(e) => {
							e.preventDefault();
							setOpen(true);
						}}
					>
						Списание/Выдача
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<WriteOffDialogControlled
				open={open}
				onOpenChange={setOpen}
				productId={row.id}
				productName={row.name}
				baseUnit={row.baseUnit}
				availableBase={row.totalBaseQuantity}
			/>
		</>
	);
}