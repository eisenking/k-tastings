import { getProductionBatchesByRecipeType } from "@/actions/recipes/getProductionBatchesByRecipeType";
import { unwrapActionOr } from "@/lib/utils/unwrapAction";
import { LOCATIONS } from "@/lib/constants/roles";
import PreparationsTabClient from "./PreparationsTabClient";

export default async function PreporationsTab() {
    const batches = await unwrapActionOr(
        getProductionBatchesByRecipeType({
            location: LOCATIONS.PASTRY,
            type: "preparation",
            onlyWithRemaining: true,
        }),
        [],
    );

    return <PreparationsTabClient batches={batches} />;
}