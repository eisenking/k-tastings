import { getProducts } from "@/actions/stock/products/getProducts";
import { getProductCategories } from "@/actions/stock/categories/getProductCategories";
import ProductsTab from "@/components/shared/stock/ProductsTab";

export default async function LocationProductsSection({ location }) {
    const [products, categories] = await Promise.all([
        getProducts({ location }),
        getProductCategories({ location }),
    ]);

    return (
        <ProductsTab
            location={location}
            products={products}
            categories={categories}
        />
    );
}