"use client";
import { useRouter } from "next/navigation";
import { LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";

type Props = {
    isAuthenticated: boolean;
    username?: string;
    variant?: "icon" | "full";
    className?: string;
};

export default function AuthButton({
    isAuthenticated,
    username,
    variant = "icon",
    className,
}: Props) {
    const router = useRouter();

    const handleSignIn = () => router.push("/login");

    const handleSignOut = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/");
                    router.refresh();
                },
            },
        });
    };

    const onClick = isAuthenticated ? handleSignOut : handleSignIn;
    const label = isAuthenticated ? "Выйти" : "Войти";
    const Icon = isAuthenticated ? LogOut : LogIn;

    if (variant === "full") {
        return (
            <Button variant="outline" onClick={onClick} className={className}>
                {isAuthenticated && username && (
                    <span className="font-medium">{username}</span>
                )}
                <Icon className="mr-2 h-4 w-4" />
                {label}
            </Button>
        );
    }

    return (
        <Button
            variant="ghost"
            onClick={onClick}
            aria-label={label}
            className={className}
        >
            {isAuthenticated && username && (
                <span className="text-sm font-medium">{username}</span>
            )}
            <Icon className="h-5 w-5" />
        </Button>
    );
}