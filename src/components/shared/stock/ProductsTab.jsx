import { unwrapActionOr } from "@/lib/utils/unwrapAction";
import { getProducts } from "@/actions/stock/products/getProducts";
import { getProductCategories } from "@/actions/stock/categories/getProductCategories";
import { DataTable } from "@/components/shared/dataTable/DataTable";
import { columns } from "./_table/columns";

/**
 * @param {{ location: "pastry" | "cafe" }} props
 */
export default async function ProductsTab({ location }) {
    // const [products, categories] = await Promise.all([
    //     getProducts({ location }),
    //     getProductCategories({ location }),
    // ]);

    const [products, categories] = await Promise.all([
        unwrapActionOr(getProducts({ location }), []),
        unwrapActionOr(getProductCategories({ location }), []),
    ]);


    return (
        <DataTable
            data={products}
            columns={columns}
            location={location}
            categories={categories}
        />
    );
}