"use client";
import { useCallback, useState } from "react";
import RecipesCarousel from "@/components/shared/recipes/RecipesCarousel";
import { DataTable } from "../TastingsTab/TastingsDataTable/data-table";
import { getProductionBatchesByRecipeType } from "@/actions/recipes/getProductionBatchesByRecipeType";
import { LOCATIONS } from "@/lib/constants/roles";

export default function TastingsTabClient({ initialBatches, columns }) {
    const [batches, setBatches] = useState(Array.isArray(initialBatches) ? initialBatches : []);
    const [refreshKey, setRefreshKey] = useState(0);
    const [loadingBatches, setLoadingBatches] = useState(false);

    const reloadAll = useCallback(async () => {
        setRefreshKey((k) => k + 1);

        setLoadingBatches(true);
        try {
            const res = await getProductionBatchesByRecipeType({
                location: LOCATIONS.PASTRY,
                type: "filling",
                onlyWithRemaining: true,
            });
            if (!res?.ok) {
                console.error(res?.error || "Не удалось загрузить партии");
                setBatches([]);
                return;
            }
            setBatches(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            console.error(e);
            setBatches([]);
        } finally {
            setLoadingBatches(false);
        }
    }, []);

    return (
        <div className="space-y-4">
            <RecipesCarousel
                type="filling"
                location={LOCATIONS.PASTRY}
                refreshKey={refreshKey}
                onProduced={reloadAll}
            />

            <div className="px-12">
                <DataTable
                    data={batches}
                    columns={columns}
                    onProduced={reloadAll}
                    loading={loadingBatches}
                />
            </div>
        </div>
    );
}
