"use client";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import RecipesCarousel from "../Recipes/RecipesCarousel";
import { DataTable } from "../PreparationsTab/PreparationsDataTable/data-table";
import { columns } from "../PreparationsTab/PreparationsDataTable/columns";

export default function PreparationsTabClient({ batches }) {
    const router = useRouter();
    const [refreshKey, setRefreshKey] = useState(0);

    const handleProduced = useCallback(() => {
        setRefreshKey((x) => x + 1);
        router.refresh();
    }, [router]);

    return (
        <div className="space-y-4">
            <RecipesCarousel type="preparation" refreshKey={refreshKey} />
            <div>
                <DataTable
                    data={batches}
                    columns={columns}
                    onProduced={handleProduced}
                />
            </div>
        </div>
    );
}