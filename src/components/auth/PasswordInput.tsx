"use client";
import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type PasswordInputProps = React.ComponentProps<typeof Input>;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ ...props }, ref) => {
        const [show, setShow] = useState(false);

        return (
            <div className="relative">
                <Input
                    type={show ? "text" : "password"}
                    ref={ref}
                    {...props}
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShow((s) => !s)}
                    aria-label={show ? "Скрыть пароль" : "Показать пароль"}
                    tabIndex={-1}
                >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
            </div>
        );
    }
);

PasswordInput.displayName = "PasswordInput";