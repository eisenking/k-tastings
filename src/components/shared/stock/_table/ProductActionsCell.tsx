// "use client";
// import { useState } from "react";
// import Link from "next/link";
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuLabel,
//     DropdownMenuSeparator,
//     DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Button } from "@/components/ui/button";
// import { MoreHorizontal } from "lucide-react";
// import WriteOffDialogControlled from "../WriteOffDialogControlled";
// import TransferProductDialog from "../TransferProductDialog";
// import type { Products } from "./columns";
// import type { Table } from "@tanstack/react-table";

// type Props = {
//     row: Products;
//     table: Table<Products>;
// };

// export default function ProductActionsCell({ row, table }: Props) {
//     const [openWriteOff, setOpenWriteOff] = useState(false);
//     const [openTransfer, setOpenTransfer] = useState(false);

//     const meta = table?.options?.meta as any;
//     const location: "pastry" | "cafe" = meta?.location;

//     const toLocation: "pastry" | "cafe" =
//         location === "pastry" ? "cafe" : "pastry";

//     const toLocationLabel =
//         toLocation === "pastry" ? "кондитерскую" : "кафе";

//     return (
//         <>
//             <DropdownMenu>
//                 <DropdownMenuTrigger asChild>
//                     <Button variant="ghost" className="h-8 w-8 p-0">
//                         <span className="sr-only">Open menu</span>
//                         <MoreHorizontal className="h-4 w-4" />
//                     </Button>
//                 </DropdownMenuTrigger>

//                 <DropdownMenuContent align="end">
//                     <DropdownMenuLabel>Действия:</DropdownMenuLabel>

//                     <DropdownMenuItem
//                         onSelect={(e) => {
//                             e.preventDefault();
//                             meta?.onQuickAdd?.(row);
//                         }}
//                     >
//                         Добавить
//                     </DropdownMenuItem>

//                     <DropdownMenuSeparator />

//                     <Link href={`/product/${row.id}`}>
//                         <DropdownMenuItem>История</DropdownMenuItem>
//                     </Link>

//                     <DropdownMenuSeparator />

//                     <DropdownMenuItem
//                         onSelect={(e) => {
//                             e.preventDefault();
//                             setOpenWriteOff(true);
//                         }}
//                     >
//                         Списание
//                     </DropdownMenuItem>

//                     <DropdownMenuItem
//                         onSelect={(e) => {
//                             e.preventDefault();
//                             setOpenTransfer(true);
//                         }}
//                     >
//                         Переместить в {toLocationLabel}
//                     </DropdownMenuItem>
//                 </DropdownMenuContent>
//             </DropdownMenu>

//             <WriteOffDialogControlled
//                 open={openWriteOff}
//                 onOpenChange={setOpenWriteOff}
//                 location={location}
//                 productId={row.id}
//                 productName={row.name}
//                 baseUnit={row.baseUnit}
//                 availableBase={row.totalBaseQuantity}
//             />

//             <TransferProductDialog
//                 open={openTransfer}
//                 onOpenChange={setOpenTransfer}
//                 fromLocation={location}
//                 toLocation={toLocation}
//                 productId={row.id}
//                 productName={row.name}
//                 baseUnit={row.baseUnit}
//                 measure={row.measure}
//                 pieceToBase={row.pieceToBase}
//                 availableBase={row.totalBaseQuantity}
//             />
//         </>
//     );
// }

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
import WriteOffDialogControlled from "../WriteOffDialogControlled";
import TransferProductDialog from "../TransferProductDialog";
import AddProductDialog from "../AddProductDialog";
import type { Products } from "./columns";
import type { Table } from "@tanstack/react-table";

type Props = {
    row: Products;
    table: Table<Products>;
};

export default function ProductActionsCell({ row, table }: Props) {
    const [addOpen, setAddOpen] = useState(false);
    const [writeOffOpen, setWriteOffOpen] = useState(false);
    const [transferOpen, setTransferOpen] = useState(false);

    const location = table.options.meta?.location;
    const categories = table.options.meta?.categories ?? [];

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Открыть меню</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Действия:</DropdownMenuLabel>

                    <DropdownMenuItem
                        onSelect={(e) => {
                            e.preventDefault();
                            setAddOpen(true);
                        }}
                    >
                        Приход
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                        <Link href={`/admin/product/${row.id}`}>История</Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        onSelect={(e) => {
                            e.preventDefault();
                            setWriteOffOpen(true);
                        }}
                    >
                        Списание
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onSelect={(e) => {
                            e.preventDefault();
                            setTransferOpen(true);
                        }}
                    >
                        Перемещение
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Приход для конкретной строки */}
            {location && (
                <AddProductDialog
                    open={addOpen}
                    onOpenChange={setAddOpen}
                    location={location}
                    categories={categories}
                    title={`Приход: ${row.name}`}
                    initialProduct={{
                        id: row.id,
                        name: row.name,
                        categoryId: row.categoryId ?? null,
                        baseUnit: row.baseUnit,
                        measure: row.measure,
                        pieceToBase: row.pieceToBase ?? null,
                    }}
                />
            )}

            {/* Списание */}
            {location && (
                <WriteOffDialogControlled
                    open={writeOffOpen}
                    onOpenChange={setWriteOffOpen}
                    location={location}
                    productId={row.id}
                    productName={row.name}
                    baseUnit={row.baseUnit}
                    availableBase={row.totalBaseQuantity}
                />
            )}

            {/* Перемещение */}
            {location && (
                <TransferProductDialog
                    open={transferOpen}
                    onOpenChange={setTransferOpen}
                    fromLocation={location}
                    toLocation={location === "pastry" ? "cafe" : "pastry"}
                    productId={row.id}
                    productName={row.name}
                    baseUnit={row.baseUnit}
                    measure={row.measure}
                    pieceToBase={row.pieceToBase}
                    availableBase={row.totalBaseQuantity}
                />
            )}
        </>
    );
}