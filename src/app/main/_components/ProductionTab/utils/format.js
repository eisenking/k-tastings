import { format } from "date-fns";
import { ru } from "date-fns/locale";

export function toNum(v, fallback = 0) {
	const n = Number(String(v ?? "").replace(",", "."));
	return Number.isFinite(n) ? n : fallback;
}

export function fmtG(v) {
	const n = toNum(v, 0);
	return `${Math.round(n)} г`;
}

export function fmtKgFromG(v) {
	const kg = toNum(v, 0) / 1000;
	return `${kg.toFixed(2)} кг`;
	}

export function cx(...xs) {
  	return xs.filter(Boolean).join(" ");
}

export function formatRangeLabel(range) {
    if (!range?.from) return "Выбери дату";
    if (!range?.to) return format(range.from, "dd.MM.yyyy", { locale: ru });
    const a = format(range.from, "dd.MM.yyyy", { locale: ru });
    const b = format(range.to, "dd.MM.yyyy", { locale: ru });
    return a === b ? a : `${a} — ${b}`;
}