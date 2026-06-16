"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/auth-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/auth/PasswordInput";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

const signUpSchema = z
    .object({
        name: z
            .string()
            .min(2, "Имя должно содержать минимум 2 символа")
            .max(50, "Имя не должно превышать 50 символов"),
        username: z
            .string()
            .min(3, "Username минимум 3 символа")
            .max(20, "Username максимум 20 символов")
            .regex(/^[a-zA-Z0-9_]+$/, "Только латиница, цифры и _"),
        email: z.string().email("Введите корректный email"),
        password: z
            .string()
            .min(8, "Минимум 8 символов")
            .regex(/[A-Za-z]/, "Должна быть хотя бы одна буква")
            .regex(/\d/, "Должна быть хотя бы одна цифра"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Пароли должны совпадать",
        path: ["confirmPassword"],
    });

type SignUpValues = z.infer<typeof signUpSchema>;

export default function RegistrationForm() {
    const router = useRouter();
    const [pending, setPending] = useState(false);

    const form = useForm<SignUpValues>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            name: "",
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (values: SignUpValues) => {
        setPending(true);

        const { error } = await authClient.signUp.email({
            name: values.name,
            username: values.username,
            email: values.email,
            password: values.password,
        });

        setPending(false);

        if (error) {
            toast.error(error.message ?? "Ошибка регистрации");
            return;
        }

        toast.success("Аккаунт успешно создан");
        router.push("/main");
        router.refresh();
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">
                        Регистрация
                    </CardTitle>
                    <CardDescription className="text-center">
                        Создайте новый аккаунт
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-4"
                        >
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Имя</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Введите ваше имя"
                                                autoComplete="name"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Имя пользователя</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="username"
                                                autoComplete="username"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Электронная почта</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="example@mail.com"
                                                autoComplete="email"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Пароль</FormLabel>
                                        <FormControl>
                                            <PasswordInput
                                                placeholder="Введите пароль"
                                                autoComplete="new-password"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Подтвердите пароль</FormLabel>
                                        <FormControl>
                                            <PasswordInput
                                                placeholder="Подтвердите пароль"
                                                autoComplete="new-password"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={pending}
                            >
                                {pending ? "Загрузка..." : "Зарегистрироваться"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>

                <CardFooter>
                    <p className="text-sm text-muted-foreground text-center w-full">
                        Уже регистрировались?{" "}
                        <Link
                            href="/"
                            className="underline underline-offset-4 font-medium text-foreground hover:text-primary"
                        >
                            Войти
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}