// "use client"
// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { useForm } from "react-hook-form";
// import { z } from "zod";
// import { zodResolver } from "@hookform/resolvers/zod";
// import Link from "next/link";
// import { cn } from "@/lib/utils";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { toast } from "sonner"
// import { authClient } from "@/lib/auth-client";

// const loginSchema = z.object({
// 	email: z.string().email("Invalid email address"),
// 	password: z.string().min(6, "Password must be at least 6 characters"),
// })

// export function LoginForm({ className, ...props }) {
// 	const router = useRouter();
// 	const [isPending, setIsPending] = useState(false);
// 	const form = useForm({
// 	resolver: zodResolver(loginSchema),
// 	defaultValues: {
// 		email: "",
// 		password: "",
// 	},
// 	})

// 	const handleSignIn = async (values) => {
// 		try {
// 			setIsPending(true);
// 			await authClient.signIn.email(
// 			{
// 				email: values.email,
// 				password: values.password,
// 			},
// 			{
// 				onRequest: () => {
// 					setIsPending(true);
// 				},
// 				onSuccess: async () => {
// 					router.push("/main");
// 				},
// 				onError: (ctx) => {
// 					toast("Ошибка авторизации", {
// 						description: "Ошибка авторизации",
// 						action: {
// 						label: "Undo",
// 						onClick: () => console.log("Undo"),
// 						},
// 					})
// 				},
// 			},
// 			);
// 		} catch (error) {
// 			toast("Event has been created", {
// 				description: "Sunday, December 03, 2023 at 9:00 AM",
// 				action: {
// 				label: "Undo",
// 				onClick: () => console.log("Undo"),
// 				},
// 			})
// 		} finally {
// 			setIsPending(false);
// 		}
// 	}

// 	return (
// 		<div className={cn("flex flex-col gap-6", className)} {...props}>
// 			<Card>
// 				<CardHeader className="text-center">
// 					<CardTitle className="text-2xl">Вход</CardTitle>
// 					<CardDescription>Введите ваш email и пароль для входа</CardDescription>
// 				</CardHeader>
// 				<CardContent>
// 					<form onSubmit={form.handleSubmit(handleSignIn)}>
// 						<div className="flex flex-col gap-6">
// 							<div className="grid gap-2">
// 								<Label htmlFor="email">Email</Label>
// 								<Input id="email" type="email" placeholder="m@example.com" {...form.register("email")} required />
// 							</div>
// 							<div className="grid gap-2">
// 								<div className="flex items-center">
// 									<Label htmlFor="password">Пароль</Label>
// 								</div>
// 								<Input id="password" type="password" {...form.register("password")} required />
// 							</div>
// 								<Button type="submit" className="w-full" disabled={isPending}>
// 								{isPending ? "Вход..." : "Войти"}
// 							</Button>
// 						</div>
// 					</form>
// 				</CardContent>
// 			</Card>
// 		</div>
// 	)
// }

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

const loginSchema = z.object({
	login: z.string().min(3, "Введите email или username"),
	password: z.string().min(6, "Пароль минимум 6 символов"),
});


export function LoginForm({ className, ...props }) {
	const router = useRouter();
	const [isPending, setIsPending] = useState(false);

	const form = useForm({
	resolver: zodResolver(loginSchema),
		defaultValues: {
			login: "",
			password: "",
		},
	});

	const handleSignIn = async (values) => {
	const isEmail = values.login.includes("@");

	try {
		setIsPending(true);

		if (isEmail) {
		await authClient.signIn.email(
			{
				email: values.login,
				password: values.password,
			},
			{
			onSuccess: () => router.push("/main"),
			onError: () => {
				toast.error("Неверный email или пароль");
			},
			}
		);
		} else {
		await authClient.signIn.username(
			{
				username: values.login,
				password: values.password,
			},
			{
			onSuccess: () => router.push("/main"),
			onError: () => {
				toast.error("Неверный username или пароль");
			},
			}
		);
		}
	} finally {
		setIsPending(false);
	}
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
					<form onSubmit={form.handleSubmit(handleSignIn)}>
						<div className="flex flex-col gap-6">
							<div className="grid gap-2">
							<Label htmlFor="login">Email или Username</Label>
							<Input
								id="login"
								placeholder="email или username"
								{...form.register("login")}
								autoComplete="username"
							/>
							</div>

							<div className="grid gap-2">
							<Label htmlFor="password">Пароль</Label>
							<Input
								id="password"
								type="password"
								{...form.register("password")}
								autoComplete="current-password"
							/>
							</div>

							<Button type="submit" className="w-full" disabled={isPending}>
								{isPending ? "Вход..." : "Войти"}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
  	);
}
