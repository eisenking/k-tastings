"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff } from "lucide-react";

const signUpSchema = z
    .object({
        name: z.string().min(2, "Имя должно содержать минимум 2 символа").max(50, "Имя не должно превышать 50 символов"),
        username: z
            .string()
            .min(3, "Username минимум 3 символа")
            .max(20, "Username максимум 20 символов"),
        email: z.string().email("Введите корректный email"),
        password: z
            .string()
            .min(5, "Пароль должен содержать минимум 5 символов"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Пароли должны совпадать",
        path: ["confirmPassword"],
    });

export default function RegistrationForm() {
    const [pending, setPending] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const form = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
        name: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    },
    });

    const onSubmit = async (values) => {
    const { name, username, email, password } = values;

    try {
        setPending(true);

        await authClient.signUp.email(
        {
            name,
            username,
            email,
            password,
        },
        {
            onSuccess: () => {
            router.push("/");
            },
            onError: (error) => {
            console.error("Ошибка регистрации", error)
            },
        },
        )
    } catch (error) {
        console.error("Ошибка:", error)
    } finally {
        setPending(false);
    }
    }

    const handlePasswordChange = (e) => {
        form.setValue("password", e.target.value);
    }

    return (
        <div className="px-8 flex items-center justify-center min-h-screen">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Регистрация</CardTitle>
                    <CardDescription className="text-center">Создайте новый аккаунт</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Имя</FormLabel>
                            <FormControl>
                                <Input placeholder="Введите ваше имя" {...field} />
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
                            <Input placeholder="username" {...field} />
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
                                <Input type="email" placeholder="Введите ваш email" {...field} />
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
                                <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Введите пароль"
                                    {...field}
                                    onChange={handlePasswordChange}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                                </div>
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
                                <Input type="password" placeholder="Подтвердите пароль" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <Button type="submit" className="w-full" disabled={pending}>
                            {pending ? "Загрузка..." : "Зарегистрироваться"}
                        </Button>
                    </form>
                    </Form>
                </CardContent>
                <CardFooter>
                    <p className="text-sm text-gray-600 text-center w-full">
                    Уже регистрировались?{" "}
                    <Button variant="link" className="p-0 h-auto font-normal underline underline-offset-4" onClick={() => router.push("/")}>
                        Войти
                    </Button>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}