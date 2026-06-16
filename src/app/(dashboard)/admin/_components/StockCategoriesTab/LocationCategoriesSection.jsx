// import { getProductCategories } from "@/actions/stock/categories/getProductCategories";
// import CategoriesManager from "./CategoriesManager";

// export default async function LocationCategoriesSection({ location }) {
//     const categories = await getProductCategories({
//         location,
//         includeArchived: true,
//     });

//     return (
//         <CategoriesManager location={location} initialCategories={categories} />
//     );
// }


// app/(dashboard)/admin/_components/StockCategoriesTab/LocationCategoriesSection.jsx
import { getProductCategories } from "@/actions/stock/categories/getProductCategories";
import CategoriesManager from "./CategoriesManager";

export default async function LocationCategoriesSection({ location }) {
    const res = await getProductCategories({
        location,
        includeArchived: true,
    });

    if (!res.ok) {
        return (
            <div className="rounded border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
                Не удалось загрузить категории: {res.error}
            </div>
        );
    }

    return (
        <CategoriesManager
            location={location}
            initialCategories={res.data}
        />
    );
}