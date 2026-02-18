import { getPreparationsBatches } from "@/app/actions/recipes/getPreparationsBatches";
import PreparationsBatchesTableClient from "./PreparationsBatchesTableClient";

export default async function PreparationsBatchesTable() {
    const rows = await getPreparationsBatches();
    return <PreparationsBatchesTableClient initialRows={rows} />;
}