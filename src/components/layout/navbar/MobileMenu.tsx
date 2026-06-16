"use client";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import type { NavLink } from "./nav-links";
import NavLinkItem from "./NavLinkItem";
import AuthButton from "./AuthButton";

type Props = {
    links: NavLink[];
    isAuthenticated: boolean;
    username?: string;
};

export default function MobileMenu({ links, isAuthenticated, username }: Props) {
    const [open, setOpen] = useState(false);
    const close = () => setOpen(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    aria-label="Открыть меню"
                >
                    <Menu className="h-5 w-5" />
                </Button>
            </SheetTrigger>

            <SheetContent side="right" className="p-4">
                <SheetTitle>Меню</SheetTitle>

                {username && (
                    <p className="mt-2 text-sm text-muted-foreground">
                    Здравствуйте, {username}!
                    </p>
                )}

                <nav className="flex flex-col gap-6 pt-8">
                    {isAuthenticated &&
                    links.map((link) => (
                        <NavLinkItem
                        key={link.href}
                        href={link.href}
                        label={link.label}
                        onNavigate={close}
                        />
                    ))}

                    <AuthButton isAuthenticated={isAuthenticated} variant="full" />
                </nav>
            </SheetContent>
        </Sheet>
    );
}