export function toBase({ unit, qty, pieceToBase }) {
    const n = Number(qty);
    if (!Number.isFinite(n) || n <= 0) {
        throw new Error("Некорректное количество");
    }

    if (unit === "г") return n;
    if (unit === "кг") return n * 1000;

    if (unit === "мл") return n;
    if (unit === "л") return n * 1000;

    if (unit === "шт") {
        const k = Number(pieceToBase);
        if (!Number.isFinite(k) || k <= 0) {
            throw new Error("Для 'шт' нужен коэффициент 1 шт = X (г/мл)");
        }
        return n * k;
    }

    throw new Error("Неизвестная единица измерения");
};

export function inferMeasureFromUnit(unit) {
    if (unit === "г" || unit === "кг") return "mass";
    if (unit === "мл" || unit === "л") return "volume";
    // для "шт" нельзя угадать — пусть выберет пользователь (или оставим mass по умолчанию)
    return "mass";
};