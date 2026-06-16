import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
    size?: number;
    href?: string | null;
    className?: string;
    priority?: boolean;
};

export default function Logo({
    size = 70,
    href = "/",
    className,
    priority = false,
}: Props) {
    const image = (
        <Image
            src="/logo.svg"
            alt="Логотип"
            width={size}
            height={size}
            priority={priority}
            className={className}
        />
    );

    if (!href) return image;

    return (
        <Link href={href} aria-label="На главную" className={cn("inline-flex", className)}>
            {image}
        </Link>
    );
}