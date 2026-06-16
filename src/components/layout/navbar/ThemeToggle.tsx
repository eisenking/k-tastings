"use client";
import dynamic from "next/dynamic";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { IconButtonSkeleton } from "./NavbarSkeleton";

function Inner() {
    const { resolvedTheme, setTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label="Переключить тему"
        >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
    );
}

const ThemeToggle = dynamic(() => Promise.resolve(Inner), {
    ssr: false,
    loading: () => <IconButtonSkeleton />,
});

export default ThemeToggle;