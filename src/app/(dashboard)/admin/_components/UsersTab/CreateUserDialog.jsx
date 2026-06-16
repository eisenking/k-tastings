"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { createUser } from "@/actions/admin/users/createUser";
import { USER_ROLES } from "@/lib/constants/roles";

const schema = z.object({
    name: z.string().min(1, "Введите имя"),
    email: z.string().email("Некорректный email"),
    username: z.string().optional(),
    password: z.string().min(8, "Минимум 8 символов"),
    role: z.enum(["none", ...USER_ROLES]).default("none"),
});

const ROLE_OPTIONS = [
    { value: "none", label: "— (без роли)" },
    ...USER_ROLES.map((r) => ({ value: r, label: r })),
];

export default function CreateUserDialog() {
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            name: "",
            email: "",
            username: "",
            password: "",
            role: "none",
        },
    });

    const role = watch("role");

    const onSubmit = async (data) => {
        const res = await createUser({
            name: data.name,
            email: data.email,
            username: data.username || undefined,
            password: data.password,
            role: data.role,
        });

        if (res?.success) {
            toast.success("Пользователь создан");
            reset();
            setOpen(false);
            router.refresh();
        } else {
            toast.error(res?.error ?? "Ошибка создания");
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                setOpen(v);
                if (!v) reset();
            }}
        >
            <DialogTrigger asChild>
                <Button>
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Создать пользователя
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Новый пользователь</DialogTitle>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-3"
                    autoComplete="off"
                >
                    <div className="space-y-1">
                        <Label>Имя</Label>
                        <Input
                            {...register("name")}
                            placeholder="Иван Иванов"
                            autoComplete="off"
                        />
                        {errors.name && (
                            <p className="text-xs text-red-500">
                                {errors.name.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <Label>Email</Label>
                        <Input
                            {...register("email")}
                            type="email"
                            placeholder="user@example.com"
                            autoComplete="off"
                        />
                        {errors.email && (
                            <p className="text-xs text-red-500">
                                {errors.email.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <Label>Username (необязательно)</Label>
                        <Input
                            {...register("username")}
                            placeholder="ivan"
                            autoComplete="off"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label>Пароль</Label>
                        <Input
                            {...register("password")}
                            type="password"
                            placeholder="минимум 8 символов"
                            autoComplete="new-password"
                        />
                        {errors.password && (
                            <p className="text-xs text-red-500">
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <Label>Роль</Label>
                        <Select
                            value={role}
                            onValueChange={(v) =>
                                setValue("role", v, { shouldValidate: true })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ROLE_OPTIONS.map((r) => (
                                    <SelectItem key={r.value} value={r.value}>
                                        {r.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full"
                    >
                        {isSubmitting ? "Создание..." : "Создать"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}