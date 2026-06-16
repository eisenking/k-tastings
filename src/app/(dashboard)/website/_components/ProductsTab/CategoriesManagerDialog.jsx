// "use client";

// import { useState, useTransition } from "react";
// import {
//     Dialog,
//     DialogContent,
//     DialogHeader,
//     DialogTitle,
//     DialogFooter,
// } from "@/components/ui/dialog";
// import {
//     AlertDialog,
//     AlertDialogAction,
//     AlertDialogCancel,
//     AlertDialogContent,
//     AlertDialogDescription,
//     AlertDialogFooter,
//     AlertDialogHeader,
//     AlertDialogTitle,
//     AlertDialogTrigger,
// } from "@/components/ui/alert-dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//     Accordion,
//     AccordionContent,
//     AccordionItem,
//     AccordionTrigger,
// } from "@/components/ui/accordion";
// import { Pencil, Trash2, Plus, Check, X } from "lucide-react";
// import { toast } from "sonner";
// import {
//     createCategory,
//     updateCategory,
//     deleteCategory,
//     createSubcategory,
//     updateSubcategory,
//     deleteSubcategory,
// } from "@/app/actions/website/categories/categories";

// function slugify(str) {
//     return str
//         .toLowerCase()
//         .trim()
//         .replace(/[^a-z0-9а-я\s-]/gi, "")
//         .replace(/\s+/g, "-")
//         .replace(/-+/g, "-");
// }

// export default function CategoriesManagerDialog({
//     open,
//     onOpenChange,
//     categories,
// }) {
//     return (
//         <Dialog open={open} onOpenChange={onOpenChange}>
//             <DialogContent className="max-w-2xl p-0 gap-0 max-h-[90vh] grid grid-rows-[auto_1fr_auto]">
//                 <DialogHeader className="px-6 pt-6 pb-4 border-b">
//                     <DialogTitle>Управление категориями</DialogTitle>
//                 </DialogHeader>

//                 <div className="overflow-y-auto px-6 py-4 space-y-6">
//                     <NewCategoryForm />

//                     {categories.length === 0 ? (
//                         <div className="text-sm text-muted-foreground text-center py-6">
//                             Категорий пока нет
//                         </div>
//                     ) : (
//                         <Accordion type="multiple" className="w-full">
//                             {categories.map((cat) => (
//                                 <CategoryRow key={cat.id} category={cat} />
//                             ))}
//                         </Accordion>
//                     )}
//                 </div>

//                 <DialogFooter className="px-6 py-4 border-t">
//                     <Button variant="outline" onClick={() => onOpenChange(false)}>
//                         Закрыть
//                     </Button>
//                 </DialogFooter>
//             </DialogContent>
//         </Dialog>
//     );
// }

// // ===== Новая категория =====
// function NewCategoryForm() {
//     const [name, setName] = useState("");
//     const [slug, setSlug] = useState("");
//     const [slugTouched, setSlugTouched] = useState(false);
//     const [isPending, startTransition] = useTransition();

//     const handleNameChange = (val) => {
//         setName(val);
//         if (!slugTouched) setSlug(slugify(val));
//     };

//     const handleSubmit = () => {
//         if (!name.trim() || !slug.trim()) {
//             toast.error("Заполните название и slug");
//             return;
//         }
//         startTransition(async () => {
//             const res = await createCategory({ name: name.trim(), slug: slug.trim() });
//             if (res.success) {
//                 toast.success("Категория создана");
//                 setName("");
//                 setSlug("");
//                 setSlugTouched(false);
//             } else {
//                 toast.error(res.error);
//             }
//         });
//     };

//     return (
//         <div className="border rounded-md p-3 space-y-2 bg-muted/30">
//             <Label className="text-sm font-medium">Новая категория</Label>
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
//                 <Input
//                     placeholder="Название"
//                     value={name}
//                     onChange={(e) => handleNameChange(e.target.value)}
//                 />
//                 <Input
//                     placeholder="slug"
//                     value={slug}
//                     onChange={(e) => {
//                         setSlug(e.target.value);
//                         setSlugTouched(true);
//                     }}
//                 />
//             </div>
//             <Button size="sm" onClick={handleSubmit} disabled={isPending}>
//                 <Plus className="h-4 w-4 mr-1" />
//                 Добавить категорию
//             </Button>
//         </div>
//     );
// }

// // ===== Строка категории =====
// function CategoryRow({ category }) {
//     const [editing, setEditing] = useState(false);
//     const [name, setName] = useState(category.name);
//     const [slug, setSlug] = useState(category.slug);
//     const [isPending, startTransition] = useTransition();

//     const handleSave = () => {
//         startTransition(async () => {
//             const res = await updateCategory(category.id, {
//                 name: name.trim(),
//                 slug: slug.trim(),
//             });
//             if (res.success) {
//                 toast.success("Категория обновлена");
//                 setEditing(false);
//             } else {
//                 toast.error(res.error);
//             }
//         });
//     };

//     const handleDelete = () => {
//         startTransition(async () => {
//             const res = await deleteCategory(category.id);
//             if (res.success) toast.success("Категория удалена");
//             else toast.error(res.error);
//         });
//     };

//     const handleCancel = () => {
//         setName(category.name);
//         setSlug(category.slug);
//         setEditing(false);
//     };

//     return (
//         <AccordionItem value={category.id} className="border rounded-md mb-2 px-2">
//             <div className="flex items-center gap-2 py-2">
//                 <AccordionTrigger className="flex-1 hover:no-underline py-2">
//                     {editing ? (
//                         <div
//                             className="grid grid-cols-2 gap-2 flex-1 mr-2"
//                             onClick={(e) => e.stopPropagation()}
//                         >
//                             <Input
//                                 value={name}
//                                 onChange={(e) => setName(e.target.value)}
//                                 placeholder="Название"
//                                 className="h-8"
//                             />
//                             <Input
//                                 value={slug}
//                                 onChange={(e) => setSlug(e.target.value)}
//                                 placeholder="slug"
//                                 className="h-8"
//                             />
//                         </div>
//                     ) : (
//                         <span className="font-medium text-left">
//                             {category.name}{" "}
//                             <span className="text-muted-foreground text-xs ml-2">
//                                 /{category.slug}
//                             </span>
//                             <span className="text-muted-foreground text-xs ml-2">
//                                 ({category.subcategories?.length ?? 0})
//                             </span>
//                         </span>
//                     )}
//                 </AccordionTrigger>

//                 <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
//                     {editing ? (
//                         <>
//                             <Button
//                                 variant="ghost"
//                                 size="sm"
//                                 onClick={handleSave}
//                                 disabled={isPending}
//                             >
//                                 <Check className="h-4 w-4" />
//                             </Button>
//                             <Button
//                                 variant="ghost"
//                                 size="sm"
//                                 onClick={handleCancel}
//                                 disabled={isPending}
//                             >
//                                 <X className="h-4 w-4" />
//                             </Button>
//                         </>
//                     ) : (
//                         <>
//                             <Button
//                                 variant="ghost"
//                                 size="sm"
//                                 onClick={() => setEditing(true)}
//                             >
//                                 <Pencil className="h-4 w-4" />
//                             </Button>
//                             <AlertDialog>
//                                 <AlertDialogTrigger asChild>
//                                     <Button
//                                         variant="ghost"
//                                         size="sm"
//                                         disabled={isPending}
//                                     >
//                                         <Trash2 className="h-4 w-4 text-destructive" />
//                                     </Button>
//                                 </AlertDialogTrigger>
//                                 <AlertDialogContent>
//                                     <AlertDialogHeader>
//                                         <AlertDialogTitle>
//                                             Удалить категорию?
//                                         </AlertDialogTitle>
//                                         <AlertDialogDescription>
//                                             Категория «{category.name}» и все её
//                                             подкатегории будут удалены.
//                                         </AlertDialogDescription>
//                                     </AlertDialogHeader>
//                                     <AlertDialogFooter>
//                                         <AlertDialogCancel>Отмена</AlertDialogCancel>
//                                         <AlertDialogAction onClick={handleDelete}>
//                                             Удалить
//                                         </AlertDialogAction>
//                                     </AlertDialogFooter>
//                                 </AlertDialogContent>
//                             </AlertDialog>
//                         </>
//                     )}
//                 </div>
//             </div>

//             <AccordionContent className="pb-3">
//                 <div className="space-y-2 pl-2">
//                     {(category.subcategories ?? []).map((sub) => (
//                         <SubcategoryRow key={sub.id} subcategory={sub} />
//                     ))}
//                     <NewSubcategoryForm categoryId={category.id} />
//                 </div>
//             </AccordionContent>
//         </AccordionItem>
//     );
// }

// // ===== Новая подкатегория =====
// function NewSubcategoryForm({ categoryId }) {
//     const [name, setName] = useState("");
//     const [slug, setSlug] = useState("");
//     const [slugTouched, setSlugTouched] = useState(false);
//     const [isPending, startTransition] = useTransition();

//     const handleNameChange = (val) => {
//         setName(val);
//         if (!slugTouched) setSlug(slugify(val));
//     };

//     const handleSubmit = () => {
//         if (!name.trim() || !slug.trim()) {
//             toast.error("Заполните название и slug");
//             return;
//         }
//         startTransition(async () => {
//             const res = await createSubcategory({
//                 categoryId,
//                 name: name.trim(),
//                 slug: slug.trim(),
//             });
//             if (res.success) {
//                 toast.success("Подкатегория создана");
//                 setName("");
//                 setSlug("");
//                 setSlugTouched(false);
//             } else {
//                 toast.error(res.error);
//             }
//         });
//     };

//     return (
//         <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
//             <Input
//                 placeholder="Название подкатегории"
//                 value={name}
//                 onChange={(e) => handleNameChange(e.target.value)}
//                 className="h-8"
//             />
//             <Input
//                 placeholder="slug"
//                 value={slug}
//                 onChange={(e) => {
//                     setSlug(e.target.value);
//                     setSlugTouched(true);
//                 }}
//                 className="h-8"
//             />
//             <Button size="sm" onClick={handleSubmit} disabled={isPending}>
//                 <Plus className="h-4 w-4" />
//             </Button>
//         </div>
//     );
// }

// // ===== Строка подкатегории =====
// function SubcategoryRow({ subcategory }) {
//     const [editing, setEditing] = useState(false);
//     const [name, setName] = useState(subcategory.name);
//     const [slug, setSlug] = useState(subcategory.slug);
//     const [isPending, startTransition] = useTransition();

//     const handleSave = () => {
//         startTransition(async () => {
//             const res = await updateSubcategory(subcategory.id, {
//                 categoryId: subcategory.categoryId,
//                 name: name.trim(),
//                 slug: slug.trim(),
//             });
//             if (res.success) {
//                 toast.success("Подкатегория обновлена");
//                 setEditing(false);
//             } else {
//                 toast.error(res.error);
//             }
//         });
//     };

//     const handleDelete = () => {
//         startTransition(async () => {
//             const res = await deleteSubcategory(subcategory.id);
//             if (res.success) toast.success("Подкатегория удалена");
//             else toast.error(res.error);
//         });
//     };

//     const handleCancel = () => {
//         setName(subcategory.name);
//         setSlug(subcategory.slug);
//         setEditing(false);
//     };

//     return (
//         <div className="flex items-center gap-2">
//             {editing ? (
//                 <>
//                     <Input
//                         value={name}
//                         onChange={(e) => setName(e.target.value)}
//                         className="h-8 flex-1"
//                     />
//                     <Input
//                         value={slug}
//                         onChange={(e) => setSlug(e.target.value)}
//                         className="h-8 flex-1"
//                     />
//                     <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={handleSave}
//                         disabled={isPending}
//                     >
//                         <Check className="h-4 w-4" />
//                     </Button>
//                     <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={handleCancel}
//                         disabled={isPending}
//                     >
//                         <X className="h-4 w-4" />
//                     </Button>
//                 </>
//             ) : (
//                 <>
//                     <span className="flex-1 text-sm">
//                         {subcategory.name}
//                         <span className="text-muted-foreground text-xs ml-2">
//                             /{subcategory.slug}
//                         </span>
//                     </span>
//                     <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => setEditing(true)}
//                     >
//                         <Pencil className="h-4 w-4" />
//                     </Button>
//                     <AlertDialog>
//                         <AlertDialogTrigger asChild>
//                             <Button variant="ghost" size="sm" disabled={isPending}>
//                                 <Trash2 className="h-4 w-4 text-destructive" />
//                             </Button>
//                         </AlertDialogTrigger>
//                         <AlertDialogContent>
//                             <AlertDialogHeader>
//                                 <AlertDialogTitle>
//                                     Удалить подкатегорию?
//                                 </AlertDialogTitle>
//                                 <AlertDialogDescription>
//                                     Подкатегория «{subcategory.name}» будет удалена.
//                                 </AlertDialogDescription>
//                             </AlertDialogHeader>
//                             <AlertDialogFooter>
//                                 <AlertDialogCancel>Отмена</AlertDialogCancel>
//                                 <AlertDialogAction onClick={handleDelete}>
//                                     Удалить
//                                 </AlertDialogAction>
//                             </AlertDialogFooter>
//                         </AlertDialogContent>
//                     </AlertDialog>
//                 </>
//             )}
//         </div>
//     );
// }

"use client";

import { useState, useTransition } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { toast } from "sonner";
import {
    createCategory,
    updateCategory,
    deleteCategory,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
} from "@/actions/website/categories/categories";

export default function CategoriesManagerDialog({
    open,
    onOpenChange,
    categories,
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl p-0 gap-0 max-h-[90vh] grid grid-rows-[auto_1fr_auto]">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <DialogTitle>Управление категориями</DialogTitle>
                    <DialogDescription>
                        Создавайте, редактируйте и удаляйте категории и
                        подкатегории товаров.
                    </DialogDescription>
                </DialogHeader>

                <div className="overflow-y-auto px-6 py-4 space-y-6">
                    <NewCategoryForm />

                    {categories.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-6">
                            Категорий пока нет
                        </div>
                    ) : (
                        <Accordion type="multiple" className="w-full">
                            {categories.map((cat) => (
                                <CategoryRow key={cat.id} category={cat} />
                            ))}
                        </Accordion>
                    )}
                </div>

                <DialogFooter className="px-6 py-4 border-t">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Закрыть
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ===== Новая категория =====
function NewCategoryForm() {
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [isPending, startTransition] = useTransition();

    const handleSubmit = () => {
        if (!name.trim() || !slug.trim()) {
            toast.error("Заполните название и slug");
            return;
        }
        startTransition(async () => {
            const res = await createCategory({
                name: name.trim(),
                slug: slug.trim(),
            });
            if (res.success) {
                toast.success("Категория создана");
                setName("");
                setSlug("");
            } else {
                toast.error(res.error);
            }
        });
    };

    return (
        <div className="border rounded-md p-3 space-y-2 bg-muted/30">
            <Label className="text-sm font-medium">Новая категория</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                    placeholder="Название"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <Input
                    placeholder="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                />
            </div>
            <Button size="sm" onClick={handleSubmit} disabled={isPending}>
                <Plus className="h-4 w-4 mr-1" />
                Добавить категорию
            </Button>
        </div>
    );
}

// ===== Строка категории =====
function CategoryRow({ category }) {
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(category.name);
    const [slug, setSlug] = useState(category.slug);
    const [isPending, startTransition] = useTransition();

    const handleSave = () => {
        startTransition(async () => {
            const res = await updateCategory(category.id, {
                name: name.trim(),
                slug: slug.trim(),
            });
            if (res.success) {
                toast.success("Категория обновлена");
                setEditing(false);
            } else {
                toast.error(res.error);
            }
        });
    };

    const handleDelete = () => {
        startTransition(async () => {
            const res = await deleteCategory(category.id);
            if (res.success) toast.success("Категория удалена");
            else toast.error(res.error);
        });
    };

    const handleCancel = () => {
        setName(category.name);
        setSlug(category.slug);
        setEditing(false);
    };

    return (
        <AccordionItem
            value={category.id}
            className="border rounded-md mb-2 px-2"
        >
            <div className="flex items-center gap-2 py-2">
                <AccordionTrigger className="flex-1 hover:no-underline py-2">
                    {editing ? (
                        <div
                            className="grid grid-cols-2 gap-2 flex-1 mr-2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Название"
                                className="h-8"
                            />
                            <Input
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                placeholder="slug"
                                className="h-8"
                            />
                        </div>
                    ) : (
                        <span className="font-medium text-left">
                            {category.name}{" "}
                            <span className="text-muted-foreground text-xs ml-2">
                                /{category.slug}
                            </span>
                            <span className="text-muted-foreground text-xs ml-2">
                                ({category.subcategories?.length ?? 0})
                            </span>
                        </span>
                    )}
                </AccordionTrigger>

                <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                >
                    {editing ? (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSave}
                                disabled={isPending}
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancel}
                                disabled={isPending}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditing(true)}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={isPending}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            Удалить категорию?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Категория «{category.name}» и все её
                                            подкатегории будут удалены.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>
                                            Отмена
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDelete}
                                        >
                                            Удалить
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    )}
                </div>
            </div>

            <AccordionContent className="pb-3">
                <div className="space-y-2 pl-2">
                    {(category.subcategories ?? []).map((sub) => (
                        <SubcategoryRow key={sub.id} subcategory={sub} />
                    ))}
                    <NewSubcategoryForm categoryId={category.id} />
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}

// ===== Новая подкатегория =====
function NewSubcategoryForm({ categoryId }) {
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [isPending, startTransition] = useTransition();

    const handleSubmit = () => {
        if (!name.trim() || !slug.trim()) {
            toast.error("Заполните название и slug");
            return;
        }
        startTransition(async () => {
            const res = await createSubcategory({
                categoryId,
                name: name.trim(),
                slug: slug.trim(),
            });
            if (res.success) {
                toast.success("Подкатегория создана");
                setName("");
                setSlug("");
            } else {
                toast.error(res.error);
            }
        });
    };

    return (
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
            <Input
                placeholder="Название подкатегории"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8"
            />
            <Input
                placeholder="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="h-8"
            />
            <Button size="sm" onClick={handleSubmit} disabled={isPending}>
                <Plus className="h-4 w-4" />
            </Button>
        </div>
    );
}

// ===== Строка подкатегории =====
function SubcategoryRow({ subcategory }) {
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(subcategory.name);
    const [slug, setSlug] = useState(subcategory.slug);
    const [isPending, startTransition] = useTransition();

    const handleSave = () => {
        startTransition(async () => {
            const res = await updateSubcategory(subcategory.id, {
                categoryId: subcategory.categoryId,
                name: name.trim(),
                slug: slug.trim(),
            });
            if (res.success) {
                toast.success("Подкатегория обновлена");
                setEditing(false);
            } else {
                toast.error(res.error);
            }
        });
    };

    const handleDelete = () => {
        startTransition(async () => {
            const res = await deleteSubcategory(subcategory.id);
            if (res.success) toast.success("Подкатегория удалена");
            else toast.error(res.error);
        });
    };

    const handleCancel = () => {
        setName(subcategory.name);
        setSlug(subcategory.slug);
        setEditing(false);
    };

    return (
        <div className="flex items-center gap-2">
            {editing ? (
                <>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-8 flex-1"
                    />
                    <Input
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="h-8 flex-1"
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSave}
                        disabled={isPending}
                    >
                        <Check className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        disabled={isPending}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </>
            ) : (
                <>
                    <span className="flex-1 text-sm">
                        {subcategory.name}
                        <span className="text-muted-foreground text-xs ml-2">
                            /{subcategory.slug}
                        </span>
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(true)}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={isPending}
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Удалить подкатегорию?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    Подкатегория «{subcategory.name}» будет
                                    удалена.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete}>
                                    Удалить
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </>
            )}
        </div>
    );
}