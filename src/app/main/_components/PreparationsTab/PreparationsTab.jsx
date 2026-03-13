// import RecipesCarousel from "../Recipes/RecipesCarousel";
// import { getProductionBatchesByRecipeType } from "@/app/actions/recipes/getProductionBatchesByRecipeType";
// import { DataTable } from "../PreparationsTab/PreparationsDataTable/data-table";
// import { columns } from "../PreparationsTab/PreparationsDataTable/columns";

// export default async function PreporationsTab() {
//     const batches = await getProductionBatchesByRecipeType("preparation");

//     return (
//         <div className="space-y-4">
//             <RecipesCarousel type="preparation" />
//             <div className="">
//                 <DataTable data={batches} columns={columns} />
//             </div>
//         </div>
//     );
// }

import { getProductionBatchesByRecipeType } from "@/app/actions/recipes/getProductionBatchesByRecipeType";
import PreparationsTabClient from "./PreparationsTabClient";

export default async function PreporationsTab() {
    const batches = await getProductionBatchesByRecipeType("preparation");

    return <PreparationsTabClient batches={batches} />;
}