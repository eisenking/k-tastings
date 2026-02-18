import { getProducts } from "@/app/actions/products/getProducts";
import { DataTable } from "./data-table";
import { columns } from "./columns";

export default async function ProductsTab() {
	const products = await getProducts();
	return (
		<DataTable data={products} columns={columns} />
	)
}