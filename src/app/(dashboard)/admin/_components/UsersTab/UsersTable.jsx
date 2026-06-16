"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { updateUserRole } from "@/actions/admin/users/updateUserRole";
import { USER_ROLES } from "@/lib/constants/roles";

const ROLE_OPTIONS = [
    { value: "none", label: "—" },
    ...USER_ROLES.map((r) => ({ value: r, label: r })),
];

function formatDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("ru-RU");
}

export default function UsersTable({ users }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleChange = (userId, newRole) => {
        startTransition(async () => {
            const res = await updateUserRole(userId, newRole);
            if (res?.success) {
                toast.success("Роль обновлена");
                router.refresh();
            } else {
                toast.error(res?.error ?? "Ошибка обновления");
            }
        });
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Имя</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Создан</TableHead>
                        <TableHead>Бан</TableHead>
                        <TableHead className="w-44">Роль</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {users.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                Нет пользователей
                            </TableCell>
                        </TableRow>
                    ) : (
                        users.map((u) => (
                            <TableRow key={u.id}>
                                <TableCell>{u.name}</TableCell>
                                <TableCell>{u.email}</TableCell>
                                <TableCell>
                                    {u.username ?? (
                                        <span className="text-muted-foreground">
                                            —
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell>{formatDate(u.createdAt)}</TableCell>
                                <TableCell>
                                    {u.banned ? (
                                        <Badge variant="destructive">
                                            забанен
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground">
                                            —
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Select
                                        value={u.role ?? "none"}
                                        onValueChange={(v) =>
                                            handleChange(u.id, v)
                                        }
                                        disabled={isPending}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ROLE_OPTIONS.map((r) => (
                                                <SelectItem
                                                    key={r.value}
                                                    value={r.value}
                                                >
                                                    {r.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}