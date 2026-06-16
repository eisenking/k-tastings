import {
    getProducts,
    getCategoriesWithSubcategories,
} from "@/actions/website/products/products";
import ProductsTabClient from "./ProductsTabClient";

export default async function ProductsTab() {
    const [productsList, categoriesList] = await Promise.all([
        getProducts(),
        getCategoriesWithSubcategories(),
    ]);

    return (
        <section className="space-y-6 p-4">
            <ProductsTabClient
                products={productsList}
                categories={categoriesList}
            />
        </section>
    );
}