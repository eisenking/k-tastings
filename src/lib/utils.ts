import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function toBaseQuantity(
    quantity: number,
    unit: string,
    weightPerUnit?: number | null
): number {
    if (unit === "кг" || unit === "л") return quantity;
    if (unit === "г" || unit === "мл") return quantity / 1000;

    if (unit === "шт") {
        if (!weightPerUnit) {
            throw new Error("weightPerUnit обязателен для шт");
        }
        return quantity * weightPerUnit;
    }

    throw new Error("Неизвестная единица измерения");
}