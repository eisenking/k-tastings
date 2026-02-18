import { getProductHistory } from "@/app/actions/products/getProductHistory";
import ProductHistoryTabs from "./ProductHistoryTabs";

type Props = {
	params: Promise<{ id: string }>;
};

export default async function ProductPage({ params }: Props) {
	const { id } = await params;
	const data = await getProductHistory(id);

	return (
		<div className="space-y-4 p-4">
			<div>
				<h1 className="text-xl font-semibold">{data.product.name}</h1>
				<p className="text-sm text-muted-foreground">
					{data.product.type} · базовая единица: {data.product.baseUnit}
				</p>
			</div>

			<ProductHistoryTabs data={data} />
		</div>
	);
}