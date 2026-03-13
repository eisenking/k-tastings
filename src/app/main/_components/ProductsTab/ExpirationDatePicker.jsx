// components/ExpirationDatePicker.jsx
"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import { Calendar as CalendarIcon } from "lucide-react";

import { format as formatDate } from "date-fns";
import { ru } from "date-fns/locale";

function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

// + N months with end-of-month safety (31 -> 30/28/29 etc.)
function addMonthsSafe(date, months) {
    const d = new Date(date);
    const day = d.getDate();

    const target = new Date(d.getFullYear(), d.getMonth() + months, 1);
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();

    target.setDate(Math.min(day, lastDay));
    return target;
}

// YYYY-MM-DD in LOCAL timezone (no UTC shifts)
function ymdLocal(date) {
    return formatDate(date, "yyyy-MM-dd");
}

// parse YYYY-MM-DD as LOCAL date (no UTC shifts)
function parseYMDLocal(s) {
    if (!s) return undefined;
    const [y, m, d] = s.split("-").map(Number);
    if (!y || !m || !d) return undefined;
    return new Date(y, m - 1, d);
}

function startOfTodayLocal() {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
}

/**
 * ExpirationDatePicker
 * value: "YYYY-MM-DD" | ""
 * onChange: (next: string) => void
 * disablePast: boolean (default true) - disable dates < today
 */
export default function ExpirationDatePicker({
    value,
    onChange,
    disablePast = true,
    className = "",
}) {
    const todayStart = startOfTodayLocal();
    const selectedDate = parseYMDLocal(value);

    const bump = (kind) => {
        const base = value ? parseYMDLocal(value) : new Date();

        let next = base;

        if (kind === "week") next = addDays(base, 7);
        if (kind === "month") next = addMonthsSafe(base, 1);
        if (kind === "3months") next = addMonthsSafe(base, 3);

        onChange(ymdLocal(next));
    };

    return (
        <div>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start w-full">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {value
                            ? formatDate(parseYMDLocal(value), "d MMMM yyyy", { locale: ru })
                            : "Выберите дату"}
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="p-0 w-auto" align="start">
                    <Calendar
                        mode="single"
                        locale={ru}
                        weekStartsOn={1}
                        selected={selectedDate}
                        disabled={disablePast ? (date) => date < todayStart : undefined}
                        onSelect={(date) => onChange(date ? ymdLocal(date) : "")}
                    />
                </PopoverContent>
            </Popover>

            <div className="mt-2 flex flex-wrap gap-1">
                <Button type="button" variant="secondary" onClick={() => bump("week")}>
                    + Неделя
                </Button>
                <Button type="button" variant="secondary" onClick={() => bump("month")}>
                    + Месяц
                </Button>
                <Button type="button" variant="secondary" onClick={() => bump("3months")}>
                    +3 Месяца
                </Button>
            </div>
        </div>
    );
}