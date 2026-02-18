"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getProducts } from "@/app/actions/products/getProducts";

function toNum(v, fallback = 0) {
    const n = Number(String(v ?? "").replace(",", "."));
    return Number.isFinite(n) ? n : fallback;
}

export async function getProductStockMap() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const products = await getProducts();

    const map = {};
    for (const p of Array.isArray(products) ? products : []) {
        map[p.id] = toNum(p.totalBaseQuantity, 0);
    }

    return map; // { [productId]: grams }
}