// import { db } from "@/drizzle/db";
// import { eq } from "drizzle-orm";
// import { ProductsTable, ProductCategoriesTable } from "@/drizzle/schema";
// import { getProductHistory } from "@/actions/stock/products/getProductHistory";
// import ProductHistoryTabs from "./ProductHistoryTabs";
// import { Badge } from "@/components/ui/badge";
// import { notFound } from "next/navigation";

// export default async function ProductPage({ params }) {
//     const { id } = await params;

//     const found = await db
//         .select({
//             id: ProductsTable.id,
//             name: ProductsTable.name,
//             location: ProductsTable.location,
//             baseUnit: ProductsTable.baseUnit,
//             measure: ProductsTable.measure,
//             categoryName: ProductCategoriesTable.name,
//         })
//         .from(ProductsTable)
//         .leftJoin(
//             ProductCategoriesTable,
//             eq(ProductsTable.categoryId, ProductCategoriesTable.id)
//         )
//         .where(eq(ProductsTable.id, id))
//         .limit(1);

//     const product = found[0];
//     if (!product) notFound();

//     const data = await getProductHistory({
//         productId: id,
//         location: product.location,
//     });

//     const locationLabel =
//         product.location === "pastry" ? "Кондитерская" : "Кафе";

//     return (
//         <div className="space-y-4 p-4">
//             <div className="space-y-2">
//                 <div className="flex items-center gap-2">
//                     <h1 className="text-xl font-semibold">{product.name}</h1>
//                     <Badge variant="outline">{locationLabel}</Badge>
//                 </div>
//                 <p className="text-sm text-muted-foreground">
//                     {product.categoryName ?? "Без категории"} · базовая
//                     единица: {product.baseUnit}
//                 </p>
//             </div>

//             <ProductHistoryTabs data={data} />
//         </div>
//     );
// }



import { notFound } from "next/navigation";
import { getProductHistory } from "@/actions/stock/products/getProductHistory";
import ProductHistoryTabs from "./ProductHistoryTabs";

export default async function ProductPage({ params, searchParams }) {
    const { id } = await params;
    const sp = await searchParams;

    const offset = Number(sp.offset ?? 0) || 0;

    const res = await getProductHistory({
        productId: id,
        offset,
        limit: 50,
        type: sp.type,
    });

    if (!res.ok) {
        if (res.error === "Не найдено") notFound();
        throw new Error(res.error);
    }

    return (
        <div className="p-6 space-y-4">
            <h1 className="text-2xl font-semibold">{res.data.product.name}</h1>
            <ProductHistoryTabs data={res.data} />
        </div>
    );
}