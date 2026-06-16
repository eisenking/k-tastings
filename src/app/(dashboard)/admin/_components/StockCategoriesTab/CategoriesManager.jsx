// "use client";
// import { useState, useTransition } from "react";
// import { useRouter } from "next/navigation";
// import { toast } from "sonner";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { PlusIcon, Pencil, Archive, Check, X } from "lucide-react";

// import { createProductCategory } from "@/actions/stock/categories/createProductCategory";
// import { updateProductCategory } from "@/actions/stock/categories/updateProductCategory";
// import { archiveProductCategory } from "@/actions/stock/categories/archiveProductCategory";

// export default function CategoriesManager({ location, initialCategories }) {
//     const router = useRouter();
//     const [isPending, startTransition] = useTransition();

//     const [newName, setNewName] = useState("");
//     const [editingId, setEditingId] = useState(null);
//     const [editingName, setEditingName] = useState("");

//     const active = initialCategories.filter((c) => !c.archivedAt);
//     const archived = initialCategories.filter((c) => c.archivedAt);

//     const handleCreate = () => {
//         const name = newName.trim();
//         if (!name) return;

//         startTransition(async () => {
//             try {
//                 await createProductCategory({ location, name });
//                 toast.success("Категория создана");
//                 setNewName("");
//                 router.refresh();
//             } catch (e) {
//                 toast.error(e?.message ?? "Ошибка создания");
//             }
//         });
//     };

//     const startEdit = (cat) => {
//         setEditingId(cat.id);
//         setEditingName(cat.name);
//     };

//     const cancelEdit = () => {
//         setEditingId(null);
//         setEditingName("");
//     };

//     const saveEdit = (cat) => {
//         const name = editingName.trim();
//         if (!name) return;
//         if (name === cat.name) {
//             cancelEdit();
//             return;
//         }

//         startTransition(async () => {
//             try {
//                 await updateProductCategory({
//                     id: cat.id,
//                     location,
//                     name,
//                 });
//                 toast.success("Категория переименована");
//                 cancelEdit();
//                 router.refresh();
//             } catch (e) {
//                 toast.error(e?.message ?? "Ошибка обновления");
//             }
//         });
//     };

//     const archive = (cat) => {
//         if (
//             !confirm(
//                 `Архивировать категорию «${cat.name}»? Существующие товары останутся.`
//             )
//         ) {
//             return;
//         }

//         startTransition(async () => {
//             try {
//                 await archiveProductCategory({ id: cat.id, location });
//                 toast.success("Категория архивирована");
//                 router.refresh();
//             } catch (e) {
//                 toast.error(e?.message ?? "Ошибка архивации");
//             }
//         });
//     };

//     return (
//         <div className="space-y-6">
//             {/* Создание */}
//             <div className="mx-auto flex gap-2 max-w-md">
//                 <Input
//                     value={newName}
//                     onChange={(e) => setNewName(e.target.value)}
//                     placeholder="Новая категория"
//                     onKeyDown={(e) => {
//                         if (e.key === "Enter") handleCreate();
//                     }}
//                 />
//                 <Button
//                     onClick={handleCreate}
//                     disabled={isPending || !newName.trim()}
//                 >
//                     <PlusIcon className="w-4 h-4 mr-1" />
//                     Добавить
//                 </Button>
//             </div>

//             {/* Активные */}
//             <div>
//                 <h3 className="font-medium mb-2">Активные</h3>
//                 {active.length === 0 ? (
//                     <p className="text-sm text-muted-foreground">
//                         Нет активных категорий
//                     </p>
//                 ) : (
//                     <ul className="divide-y rounded border">
//                         {active.map((cat) => {
//                             const isEditing = editingId === cat.id;
//                             return (
//                                 <li
//                                     key={cat.id}
//                                     className="flex items-center justify-between gap-2 px-3 py-2"
//                                 >
//                                     {isEditing ? (
//                                         <Input
//                                             value={editingName}
//                                             onChange={(e) =>
//                                                 setEditingName(e.target.value)
//                                             }
//                                             onKeyDown={(e) => {
//                                                 if (e.key === "Enter")
//                                                     saveEdit(cat);
//                                                 if (e.key === "Escape")
//                                                     cancelEdit();
//                                             }}
//                                             autoFocus
//                                             className="max-w-xs"
//                                         />
//                                     ) : (
//                                         <span>{cat.name}</span>
//                                     )}

//                                     <div className="flex items-center gap-1">
//                                         {isEditing ? (
//                                             <>
//                                                 <Button
//                                                     size="icon"
//                                                     variant="ghost"
//                                                     onClick={() => saveEdit(cat)}
//                                                     disabled={isPending}
//                                                     title="Сохранить"
//                                                 >
//                                                     <Check className="w-4 h-4" />
//                                                 </Button>
//                                                 <Button
//                                                     size="icon"
//                                                     variant="ghost"
//                                                     onClick={cancelEdit}
//                                                     disabled={isPending}
//                                                     title="Отмена"
//                                                 >
//                                                     <X className="w-4 h-4" />
//                                                 </Button>
//                                             </>
//                                         ) : (
//                                             <>
//                                                 <Button
//                                                     size="icon"
//                                                     variant="ghost"
//                                                     onClick={() =>
//                                                         startEdit(cat)
//                                                     }
//                                                     disabled={isPending}
//                                                     title="Переименовать"
//                                                 >
//                                                     <Pencil className="w-4 h-4" />
//                                                 </Button>
//                                                 <Button
//                                                     size="icon"
//                                                     variant="ghost"
//                                                     onClick={() => archive(cat)}
//                                                     disabled={isPending}
//                                                     title="Архивировать"
//                                                 >
//                                                     <Archive className="w-4 h-4" />
//                                                 </Button>
//                                             </>
//                                         )}
//                                     </div>
//                                 </li>
//                             );
//                         })}
//                     </ul>
//                 )}
//             </div>

//             {/* Архив */}
//             {archived.length > 0 && (
//                 <div>
//                     <h3 className="font-medium mb-2">Архив</h3>
//                     <ul className="divide-y rounded border opacity-70">
//                         {archived.map((cat) => (
//                             <li
//                                 key={cat.id}
//                                 className="flex items-center justify-between px-3 py-2"
//                             >
//                                 <span className="line-through">{cat.name}</span>
//                                 <span className="text-xs text-muted-foreground">
//                                     архив
//                                 </span>
//                             </li>
//                         ))}
//                     </ul>
//                 </div>
//             )}
//         </div>
//     );
// }


"use client";

// app/(dashboard)/admin/_components/StockCategoriesTab/CategoriesManager.jsx
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlusIcon, Pencil, Archive, ArchiveRestore, Check, X } from "lucide-react";

import { createProductCategory } from "@/actions/stock/categories/createProductCategory";
import { updateProductCategory } from "@/actions/stock/categories/updateProductCategory";
import { archiveProductCategory } from "@/actions/stock/categories/archiveProductCategory";

export default function CategoriesManager({ location, initialCategories }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [newName, setNewName] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState("");

    // Состояние диалога подтверждения архивации
    const [confirmTarget, setConfirmTarget] = useState(null); // { id, name } | null

    const active = initialCategories.filter((c) => !c.archivedAt);
    const archived = initialCategories.filter((c) => c.archivedAt);

    // ─── Создание ────────────────────────────────────────────────────────────
    const handleCreate = () => {
        const name = newName.trim();
        if (!name) return;

        startTransition(async () => {
            const res = await createProductCategory({ location, name });
            if (!res.ok) {
                toast.error(res.error);
                return;
            }
            toast.success("Категория создана");
            setNewName("");
            router.refresh();
        });
    };

    // ─── Переименование ──────────────────────────────────────────────────────
    const startEdit = (cat) => {
        setEditingId(cat.id);
        setEditingName(cat.name);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditingName("");
    };

    const saveEdit = (cat) => {
        const name = editingName.trim();
        if (!name) return;
        if (name === cat.name) {
            cancelEdit();
            return;
        }

        startTransition(async () => {
            const res = await updateProductCategory({ id: cat.id, name });
            if (!res.ok) {
                toast.error(res.error);
                return;
            }
            toast.success("Категория переименована");
            cancelEdit();
            router.refresh();
        });
    };

    // ─── Архивация / Разархивация ────────────────────────────────────────────
    const requestArchive = (cat) => setConfirmTarget(cat);

    const confirmArchive = () => {
        if (!confirmTarget) return;
        const target = confirmTarget;
        setConfirmTarget(null);

        startTransition(async () => {
            const res = await archiveProductCategory({ id: target.id });
            if (!res.ok) {
                toast.error(res.error);
                return;
            }
            toast.success("Категория архивирована");
            router.refresh();
        });
    };

    const unarchive = (cat) => {
        startTransition(async () => {
            const res = await archiveProductCategory({ id: cat.id });
            if (!res.ok) {
                toast.error(res.error);
                return;
            }
            toast.success("Категория восстановлена");
            router.refresh();
        });
    };

    // ─── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Создание */}
            <div className="mx-auto flex gap-2 max-w-md">
                <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Новая категория"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreate();
                    }}
                    disabled={isPending}
                />
                <Button
                    onClick={handleCreate}
                    disabled={isPending || !newName.trim()}
                >
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Добавить
                </Button>
            </div>

            {/* Активные */}
            <div>
                <h3 className="font-medium mb-2">Активные</h3>
                {active.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Нет активных категорий
                    </p>
                ) : (
                    <ul className="divide-y rounded border">
                        {active.map((cat) => {
                            const isEditing = editingId === cat.id;
                            return (
                                <li
                                    key={cat.id}
                                    className="flex items-center justify-between gap-2 px-3 py-2"
                                >
                                    {isEditing ? (
                                        <Input
                                            value={editingName}
                                            onChange={(e) =>
                                                setEditingName(e.target.value)
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") saveEdit(cat);
                                                if (e.key === "Escape") cancelEdit();
                                            }}
                                            autoFocus
                                            className="max-w-xs"
                                            disabled={isPending}
                                        />
                                    ) : (
                                        <span>{cat.name}</span>
                                    )}

                                    <div className="flex items-center gap-1">
                                        {isEditing ? (
                                            <>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => saveEdit(cat)}
                                                    disabled={isPending}
                                                    title="Сохранить"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={cancelEdit}
                                                    disabled={isPending}
                                                    title="Отмена"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => startEdit(cat)}
                                                    disabled={isPending}
                                                    title="Переименовать"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => requestArchive(cat)}
                                                    disabled={isPending}
                                                    title="Архивировать"
                                                >
                                                    <Archive className="w-4 h-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Архив */}
            {archived.length > 0 && (
                <div>
                    <h3 className="font-medium mb-2">Архив</h3>
                    <ul className="divide-y rounded border">
                        {archived.map((cat) => (
                            <li
                                key={cat.id}
                                className="flex items-center justify-between gap-2 px-3 py-2 opacity-70"
                            >
                                <span className="line-through">{cat.name}</span>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => unarchive(cat)}
                                    disabled={isPending}
                                    title="Восстановить"
                                >
                                    <ArchiveRestore className="w-4 h-4" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Диалог подтверждения архивации */}
            <AlertDialog
                open={!!confirmTarget}
                onOpenChange={(open) => {
                    if (!open) setConfirmTarget(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Архивировать категорию «{confirmTarget?.name}»?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Существующие товары категории останутся. Категория исчезнет
                            из активного списка, но её можно восстановить позже.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Отмена</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmArchive}
                            disabled={isPending}
                        >
                            Архивировать
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}