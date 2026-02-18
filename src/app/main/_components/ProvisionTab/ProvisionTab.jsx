import RecipesCarousel from "../Recipes/RecipesCarousel";
import { getProductionBatchesByRecipeType } from "@/app/actions/recipes/getProductionBatchesByRecipeType";
import { DataTable } from "../Recipes/BatchesTable/data-table";
import { columns } from "../Recipes/BatchesTable/columns";

export default async function ProvisionTab() {
    const batches = await getProductionBatchesByRecipeType("preparation");

    return (
        <div className="space-y-4">
            <RecipesCarousel type="preparation" />

            <div className="px-12">
                <DataTable data={batches} columns={columns} />
            </div>
        </div>
    );
}