"use client";
import { useCallback, useState } from "react";
import RecipesCarousel from "../Recipes/RecipesCarousel";
import { DataTable } from "../TastingsTab/TastingsDataTable/data-table";
import { getProductionBatchesByRecipeType } from "@/app/actions/recipes/getProductionBatchesByRecipeType";

export default function TastingsTabClient({ initialBatches, columns }) {
    const [batches, setBatches] = useState(Array.isArray(initialBatches) ? initialBatches : []);
    const [refreshKey, setRefreshKey] = useState(0);
    const [loadingBatches, setLoadingBatches] = useState(false);

    const reloadAll = useCallback(async () => {
        setRefreshKey((k) => k + 1);

        setLoadingBatches(true);
        try {
            const next = await getProductionBatchesByRecipeType("filling");
            setBatches(Array.isArray(next) ? next : []);
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