"use client";
import { useEffect, useState } from "react";

/**
 * Возвращает значение с задержкой. Меняется только когда `value`
 * перестаёт меняться в течение `delay` мс.
 */
export function useDebouncedValue(value, delay = 250) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounced;
}