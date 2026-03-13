// import RecipesCarousel from "../Recipes/RecipesCarousel";
// import { getProductionBatchesByRecipeType } from "@/app/actions/recipes/getProductionBatchesByRecipeType";
// import { DataTable } from "../TastingsTab/TastingsDataTable/data-table";
// import { columns } from "../TastingsTab/TastingsDataTable/columns";

// export default async function TastingsTab() {
//     const batches = await getProductionBatchesByRecipeType("filling");

//     return (
//         <div className="space-y-4">
//             <RecipesCarousel type="filling" />

//             <div className="px-12">
//                 <DataTable data={batches} columns={columns} />
//             </div>
//         </div>
//     );
// }

import TastingsTabClient from "./TastingsTabClient";
import { getProductionBatchesByRecipeType } from "@/app/actions/recipes/getProductionBatchesByRecipeType";
import { columns } from "../TastingsTab/TastingsDataTable/columns";

export default async function TastingsTab() {
    const batches = await getProductionBatchesByRecipeType("filling");

    return (
        <TastingsTabClient
            initialBatches={batches}
            columns={columns}
        />
    );
}