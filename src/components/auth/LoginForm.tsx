"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/auth/PasswordInput";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

const loginSchema = z.object({
    login: z.string().min(3, "Введите email или username"),
    password: z.string().min(6, "Пароль минимум 6 символов"),
});

type LoginValues = z.infer<typeof loginSchema>;

interface LoginFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export function LoginForm({ className, ...props }: LoginFormProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get("redirect") ?? "/pastry";

    const [isPending, setIsPending] = useState(false);

    const form = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { login: "", password: "" },
    });

    const handleSignIn = async (values: LoginValues) => {
        setIsPending(true);
        const isEmail = values.login.includes("@");

        const { error } = isEmail
            ? await authClient.signIn.email({
                  email: values.login,
                  password: values.password,
              })
            : await authClient.signIn.username({
                  username: values.login,
                  password: values.password,
              });

        setIsPending(false);

        if (error) {
            toast.error(error.message ?? "Неверный логин или пароль");
            return;
        }

        router.push(redirectTo);
        router.refresh();
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Вход</CardTitle>
                    <CardDescription>
                        Введите email или username и пароль
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(handleSignIn)}
                            className="flex flex-col gap-6"
                        >
                            <FormField
                                control={form.control}
                                name="login"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email / Username</FormLabel>
                                        <FormControl>
                                            <Input
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
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center justify-between">
                                            <FormLabel>Пароль</FormLabel>
                                            <Link
                                                href="/forgot-password"
                                                className="text-xs underline-offset-4 hover:underline"
                                            >
                                                Забыли пароль?
                                            </Link>
                                        </div>
                                        <FormControl>
                                            <PasswordInput
                                                autoComplete="current-password"
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
                                disabled={isPending}
                            >
                                {isPending ? "Вход..." : "Войти"}
                            </Button>

                            <p className="text-sm text-center text-muted-foreground">
                                Нет аккаунта?{" "}
                                <Link
                                    href="/sign-up"
                                    className="underline underline-offset-4 text-foreground hover:text-primary"
                                >
                                    Зарегистрироваться
                                </Link>
                            </p>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}