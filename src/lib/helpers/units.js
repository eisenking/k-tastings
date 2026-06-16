// lib/helpers/units.js
import { ValidationError } from "@/lib/utils/errors";
import {
    INPUT_UNITS,
    UNIT_TO_BASE_FACTOR,
    UNIT_TO_MEASURE,
    MEASURE_TO_BASE_UNIT,
    UNIT_LABELS,
} from "@/lib/constants/units";

// ─── Внутренние утилиты ─────────────────────────────────────────────────────
function assertValidUnit(unit) {
    if (!INPUT_UNITS.includes(unit)) {
        throw new ValidationError(`Неизвестная единица: «${unit}»`);
    }
}

// ─── Конвертация UI-единиц в базовую (g или ml) ─────────────────────────────
/**
 * Переводит количество из единицы ввода в базовую единицу (g/ml).
 *
 * @param {object} args
 * @param {"g"|"kg"|"ml"|"l"|"pcs"} args.unit
 * @param {number} args.qty       — количество в указанной единице
 * @param {number|null} [args.pieceToBase] — обязателен для unit="pcs"
 * @returns {number} qtyBase — количество в базовой единице
 */
export function toBase({ unit, qty, pieceToBase = null }) {
    assertValidUnit(unit);

    if (!Number.isFinite(qty) || qty <= 0) {
        throw new ValidationError("Количество должно быть положительным числом");
    }

    if (unit === "pcs") {
        if (!Number.isFinite(pieceToBase) || pieceToBase <= 0) {
            throw new ValidationError(
                "Для «шт» нужно указать, сколько г/мл в 1 шт (pieceToBase)",
            );
        }
        return qty * pieceToBase;
    }

    return qty * UNIT_TO_BASE_FACTOR[unit];
}

// ─── Обратная конвертация (из базы в UI-единицу) ────────────────────────────
/**
 * Переводит количество из базовой единицы в UI-единицу.
 * Используется на UI-стороне для отображения.
 */
export function fromBase({ unit, qtyBase, pieceToBase = null }) {
    assertValidUnit(unit);

    if (unit === "pcs") {
        if (!Number.isFinite(pieceToBase) || pieceToBase <= 0) return 0;
        return qtyBase / pieceToBase;
    }

    return qtyBase / UNIT_TO_BASE_FACTOR[unit];
}

// ─── Определение меры по единице ────────────────────────────────────────────
/**
 * По UI-единице возвращает меру продукта.
 * Для "pcs" возвращает null — мера должна быть указана явно (mass/volume).
 */
export function inferMeasureFromUnit(unit) {
    assertValidUnit(unit);
    return UNIT_TO_MEASURE[unit];
}

// ─── Базовая единица из меры ────────────────────────────────────────────────
/**
 * Какая базовая единица соответствует мере продукта.
 * Для "piece" возвращает null — нужен явный baseUnit на продукте.
 */
export function baseUnitFromMeasure(measure) {
    return MEASURE_TO_BASE_UNIT[measure] ?? null;
}

// ─── Проверка совместимости ─────────────────────────────────────────────────
/**
 * Проверяет, что единица ввода совместима с продуктом.
 * Бросает ValidationError, если нет.
 *
 * @param {object} args
 * @param {"g"|"kg"|"ml"|"l"|"pcs"} args.inputUnit
 * @param {"mass"|"volume"|"piece"} args.productMeasure
 * @param {"g"|"ml"} args.productBaseUnit
 */
export function assertUnitCompatible({
    inputUnit,
    productMeasure,
    productBaseUnit,
}) {
    assertValidUnit(inputUnit);

    if (inputUnit === "pcs") {
        // "шт" совместимо с любой мерой — лишь бы у продукта был задан pieceToBase
        // (это проверяется отдельно в toBase)
        return;
    }

    const inputMeasure = UNIT_TO_MEASURE[inputUnit];

    if (inputMeasure !== productMeasure) {
        throw new ValidationError(
            `Несовместимая единица: продукт измеряется в ${UNIT_LABELS[productBaseUnit]}, ` +
                `а введено в ${UNIT_LABELS[inputUnit]}`,
        );
    }
}

// ─── Себестоимость за единицу (для UI) ──────────────────────────────────────
/**
 * Конвертирует unit_cost_base (себестоимость за г/мл)
 * в "красивую" цену за кг/л — для отображения.
 */
export function unitCostToBigUnit(unitCostBase, baseUnit) {
    if (unitCostBase == null) return null;
    const n = Number(unitCostBase);
    if (!Number.isFinite(n)) return null;
    // baseUnit === "g" → за кг; "ml" → за л
    return n * 1000;
}

export function bigUnitOf(baseUnit) {
    return baseUnit === "g" ? "kg" : "l";
}