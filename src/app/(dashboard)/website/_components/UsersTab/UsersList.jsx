"use client";

import { useState, useTransition } from "react";
import { updateUserRole } from "@/actions/admin/users/updateUserRole";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const ROLES = [
    { value: "none", label: "Без роли" },
    { value: "user", label: "Пользователь" },
    { value: "moderator", label: "Модератор" },
    { value: "admin", label: "Администратор" },
];

export default function UsersList({ users: initialUsers }) {
    const [users, setUsers] = useState(initialUsers);
    const [search, setSearch] = useState("");
    const [pendingId, setPendingId] = useState(null);
    const [isPending, startTransition] = useTransition();

    const filtered = users.filter((u) => {
        const q = search.toLowerCase();
        return (
            u.name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.username?.toLowerCase().includes(q)
        );
    });

    const handleRoleChange = (userId, newRole) => {
        const previous = users.find((u) => u.id === userId)?.role;

        setUsers((prev) =>
            prev.map((u) =>
                u.id === userId
                    ? { ...u, role: newRole === "none" ? null : newRole }
                    : u,
            ),
        );
        setPendingId(userId);

        startTransition(async () => {
            const result = await updateUserRole(userId, newRole);

            if (!result.success) {
                setUsers((prev) =>
                    prev.map((u) =>
                        u.id === userId ? { ...u, role: previous } : u,
                    ),
                );
                toast.error(result.error || "Не удалось обновить роль");
            } else {
                toast.success("Роль успешно обновлена");
            }

            setPendingId(null);
        });
    };

    return (
        <div className="space-y-4">
            <Input
                placeholder="Поиск по имени, email или username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
            />

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Пользователь</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead>Дата регистрации</TableHead>
                            <TableHead className="w-50">Роль</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="text-center text-muted-foreground h-24"
                                >
                                    Пользователи не найдены
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((u) => (
                                <TableRow key={u.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={u.image} alt={u.name} />
                                                <AvatarFallback>
                                                    {u.name?.charAt(0)?.toUpperCase() || "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{u.name}</span>
                                                {u.username && (
                                                    <span className="text-xs text-muted-foreground">
                                                        @{u.username}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {u.email}
                                    </TableCell>
                                    <TableCell>
                                        {u.banned ? (
                                            <Badge variant="destructive">Заблокирован</Badge>
                                        ) : (
                                            <Badge variant="secondary">Активен</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {new Date(u.createdAt).toLocaleDateString("ru-RU")}
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            value={u.role || "none"}
                                            onValueChange={(value) =>
                                                handleRoleChange(u.id, value)
                                            }
                                            disabled={isPending && pendingId === u.id}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ROLES.map((role) => (
                                                    <SelectItem
                                                        key={role.value}
                                                        value={role.value}
                                                    >
                                                        {role.label}
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
        </div>
    );
}