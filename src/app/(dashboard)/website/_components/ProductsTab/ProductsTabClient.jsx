"use client";
import { useState, useTransition } from "react";
import Image from "next/image.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pencil, Plus, Trash2, Search, FolderTree } from "lucide-react";
import { toast } from "sonner";
import { deleteProduct } from "@/actions/website/products/products";
import ProductFormDialog from "./ProductFormDialog.jsx";
import CategoriesManagerDialog from "./CategoriesManagerDialog.jsx";

export default function ProductsTabClient({ products, categories }) {
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [categoriesOpen, setCategoriesOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const filtered = products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = (id) => {
        startTransition(async () => {
            const res = await deleteProduct(id);
            if (res.success) toast.success("Товар удалён");
            else toast.error(res.error);
        });
    };

    const openCreate = () => {
        setEditing(null);
        setOpen(true);
    };
    const openEdit = (product) => {
        setEditing(product);
        setOpen(true);
    };

    return (
        <>
            <div className="flex flex-wrap justify-center gap-3">
                <div className="flex flex-wrap  items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setCategoriesOpen(true)}
                    >
                        <FolderTree className="h-4 w-4 mr-1" />
                        Категории
                    </Button>
                    <Button onClick={openCreate}>
                        <Plus className="h-4 w-4 mr-1" />
                        Добавить товар
                    </Button>
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Поиск..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 w-64"
                        />
                    </div>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="text-center text-muted-foreground py-12 border rounded-lg">
                    Товары не найдены
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((product) => (
                        <Card key={product.id} className="overflow-hidden">
                            {product.imgUrl && (
                                <div className="relative w-full h-40">
                                    <Image
                                    src={`/${product.imgUrl}`}
                                    alt={product.imgAlt ?? product.name}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                    />
                                </div>
                            )}
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-start justify-between gap-2">
                                    <span className="line-clamp-1">
                                        {product.name}
                                    </span>
                                    {product.isNewProduct && (
                                        <Badge variant="secondary">New</Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="text-sm text-muted-foreground line-clamp-2">
                                    {product.description ?? "Без описания"}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">
                                        {product.price ?? "—"} ₽
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        /{product.url}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {product.categories?.map((c) => (
                                        <Badge
                                            key={c.category.id}
                                            variant="outline"
                                        >
                                            {c.category.name}
                                        </Badge>
                                    ))}
                                    {product.subcategories?.map((s) => (
                                        <Badge
                                            key={s.subcategory.id}
                                            variant="secondary"
                                        >
                                            {s.subcategory.name}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openEdit(product)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                disabled={isPending}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    Удалить товар?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Действие необратимо. Товар
                                                    «{product.name}» будет
                                                    удалён.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>
                                                    Отмена
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() =>
                                                        handleDelete(product.id)
                                                    }
                                                >
                                                    Удалить
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <CategoriesManagerDialog
                open={categoriesOpen}
                onOpenChange={setCategoriesOpen}
                categories={categories}
            />

            <ProductFormDialog
                open={open}
                onOpenChange={setOpen}
                categories={categories}
                product={editing}
            />

        </>
    );
}