import TastingsTabClient from "./TastingsTabClient";
import { getProductionBatchesByRecipeType } from "@/actions/recipes/getProductionBatchesByRecipeType";
import { unwrapActionOr } from "@/lib/utils/unwrapAction";
import { LOCATIONS } from "@/lib/constants/roles";
import { columns } from "../TastingsTab/TastingsDataTable/columns";

export default async function TastingsTab() {
    const batches = await unwrapActionOr(
        getProductionBatchesByRecipeType({
            location: LOCATIONS.PASTRY,
            type: "filling",
            onlyWithRemaining: true,
        }),
        [],
    );

    return (
        <TastingsTabClient
            initialBatches={batches}
            columns={columns}
        />
    );
}
