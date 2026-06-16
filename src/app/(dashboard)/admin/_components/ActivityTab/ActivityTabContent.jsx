"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { getActivity } from "@/actions/admin/activity/getActivity";
import ActivityFilters from "./ActivityFilters";
import ActivityTable from "./ActivityTable";
import ActivityPagination from "./ActivityPagination";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_FILTERS = {
    search: "",
    action: "",
    entity: "",
    location: "",
    from: "",
    to: "",
    page: 1,
    pageSize: 50,
};

export default function ActivityTabContent() {
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [data, setData] = useState({ rows: [], total: 0, page: 1, pageSize: 50, pageCount: 0 });
    const [isPending, startTransition] = useTransition();
    const [initialLoading, setInitialLoading] = useState(true);

    const load = useCallback((nextFilters) => {
        startTransition(async () => {
            const res = await getActivity(nextFilters);
            if (!res.ok) {
                toast.error(res.error ?? "Ошибка загрузки");
                return;
            }
            setData(res.data);
            setInitialLoading(false);
        });
    }, []);

    useEffect(() => {
        load(filters);
    }, [filters, load]);

    const handleFiltersChange = (next) => setFilters(next);

    const handleReset = () => setFilters(DEFAULT_FILTERS);

    const handlePageChange = (page) =>
        setFilters((f) => ({ ...f, page }));

    const handlePageSizeChange = (pageSize) =>
        setFilters((f) => ({ ...f, pageSize, page: 1 }));

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <ActivityFilters
                filters={filters}
                onChange={handleFiltersChange}
                onReset={handleReset}
            />

            <div className="relative">
                {isPending && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-md">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                )}
                <ActivityTable rows={data.rows} />
            </div>

            <ActivityPagination
                page={data.page}
                pageSize={data.pageSize}
                pageCount={data.pageCount}
                total={data.total}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
            />
        </div>
    );
}