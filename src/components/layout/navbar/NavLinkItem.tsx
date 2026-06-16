"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Props = {
    href: string;
    label: string;
    onNavigate?: () => void;
    className?: string;
};

export default function NavLinkItem({ href, label, onNavigate, className }: Props) {
    const pathname = usePathname();
    const isActive = pathname === href || pathname.startsWith(`${href}/`);

    return (
        <Link
            href={href}
            onClick={onNavigate}
            className={cn(
            "transition-colors hover:text-foreground/80",
            isActive ? "text-foreground font-semibold" : "text-foreground/60",
            className
            )}
        >
            {label}
        </Link>
    );
}