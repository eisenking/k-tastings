"use client";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

function cx(...xs) {
  	return xs.filter(Boolean).join(" ");
}

function formatRangeLabel(range) {
    if (!range?.from) return "Выбери дату";
    if (!range?.to) return format(range.from, "dd.MM.yyyy", { locale: ru });
    const a = format(range.from, "dd.MM.yyyy", { locale: ru });
    const b = format(range.to, "dd.MM.yyyy", { locale: ru });
    return a === b ? a : `${a} — ${b}`;
}

export default function DateRangePicker({ value, onChange }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start gap-2 w-full sm:w-65">
                    <CalendarIcon className="h-4 w-4" />
                    <span className={cx(!value?.from && "text-muted-foreground")}>
                    {formatRangeLabel(value)}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="end">
                <Calendar
                    mode="range"
                    selected={value}
                    onSelect={(range) => onChange?.(range || { from: undefined, to: undefined })}
                    numberOfMonths={2}
                    locale={ru}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}

// если нужно использовать label снаружи — можно экспортнуть отдельно, но пока не надо
export { formatRangeLabel };