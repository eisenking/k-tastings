"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ACTION_OPTIONS, ENTITY_OPTIONS, LOCATION_OPTIONS } from "./_constants";
import { X } from "lucide-react";

const ALL = "__all__";

export default function ActivityFilters({ filters, onChange, onReset }) {
    const update = (patch) => onChange({ ...filters, ...patch, page: 1 });

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2 mb-4">
            <Input
                placeholder="Поиск по описанию…"
                value={filters.search ?? ""}
                onChange={(e) => update({ search: e.target.value })}
                className="lg:col-span-2"
            />

            <Select
                value={filters.action ?? ALL}
                onValueChange={(v) => update({ action: v === ALL ? "" : v })}
            >
                <SelectTrigger><SelectValue placeholder="Действие" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL}>Все действия</SelectItem>
                    {ACTION_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                value={filters.entity ?? ALL}
                onValueChange={(v) => update({ entity: v === ALL ? "" : v })}
            >
                <SelectTrigger><SelectValue placeholder="Сущность" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL}>Все сущности</SelectItem>
                    {ENTITY_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                value={filters.location ?? ALL}
                onValueChange={(v) => update({ location: v === ALL ? "" : v })}
            >
                <SelectTrigger><SelectValue placeholder="Локация" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL}>Все локации</SelectItem>
                    {LOCATION_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <div className="flex gap-2">
                <Input
                    type="date"
                    value={filters.from ?? ""}
                    onChange={(e) => update({ from: e.target.value })}
                />
                <Input
                    type="date"
                    value={filters.to ?? ""}
                    onChange={(e) => update({ to: e.target.value })}
                />
            </div>

            <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                className="lg:col-span-6 md:w-fit"
            >
                <X className="w-4 h-4 mr-1" /> Сбросить фильтры
            </Button>
        </div>
    );
}