"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import AddRecipeForm from "./AddRecipeForm";
import DetailedRecipe from "./DetailedRecipe";
import { getRecipesByType } from "@/app/actions/recipes/getRecipesByType";

const PREP_TABS = ["Крема", "Бисквиты", "Промочки", "Прочее"];

function formatNum(v) {
	const n = Number(v);
	if (!Number.isFinite(n)) return "0";
	return n.toFixed(0);
}

export default function RecipesCarousel({ type, refreshKey, onProduced }) {
	const router = useRouter();
	const [recipes, setRecipes] = useState([]);
	const [loading, setLoading] = useState(true);

	const [openDetails, setOpenDetails] = useState(false);
	const [selectedRecipeId, setSelectedRecipeId] = useState(null);

	const [prepCat, setPrepCat] = useState("Крема");

	async function fetchRecipes(nextType = type, nextCat = prepCat) {
		setLoading(true);
		try {
			const data =
			nextType === "preparation"
				? await getRecipesByType(nextType, nextCat)
				: await getRecipesByType(nextType);

			setRecipes(Array.isArray(data) ? data : []);
		} catch (e) {
			console.error(e);
			setRecipes([]);
		} finally {
			setLoading(false);
		}
	}

	// При смене type — сбрасываем вкладку и подтягиваем
	useEffect(() => {
		if (type === "preparation") {
			setPrepCat("Крема");
			fetchRecipes(type, "Крема");
		} else {
			fetchRecipes(type, undefined);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [type]);

	// При смене вкладки — перезапрашиваем (только preparation)
	useEffect(() => {
		if (type !== "preparation") return;
		fetchRecipes(type, prepCat);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [prepCat]);

	useEffect(() => {
        if (type === "preparation") {
            fetchRecipes(type, prepCat);
        } else {
            fetchRecipes(type, undefined);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshKey]);

	return (
		<div className="flex flex-col gap-2 ">
			<DetailedRecipe
			open={openDetails}
			onOpenChange={setOpenDetails}
			recipeId={selectedRecipeId}
			onProduced={() => {
				fetchRecipes(type, type === "preparation" ? prepCat : undefined);
				onProduced?.();
				router.refresh();
			}}
			/>
			<div className="flex flex-col justify-center items-center gap-2">
				<AddRecipeForm
					onCreated={() => fetchRecipes(type, type === "preparation" ? prepCat : undefined)}
					defaultRecipeType={type}
				/>
				{type === "preparation" && (
					<Tabs value={prepCat} onValueChange={setPrepCat}>
					<TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2 h-auto">
						{PREP_TABS.map((c) => (
						<TabsTrigger key={c} value={c}>
							{c}
						</TabsTrigger>
						))}
					</TabsList>
					</Tabs>
				)}
			</div>

			{loading ? (
			<Carousel opts={{ loop: true }} className="m-auto w-full px-6">
				<CarouselContent className="-ml-1">
					{Array.from({ length: 6 }).map((_, i) => (
						<CarouselItem
						key={i}
						className="pl-1 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/6"
						>
						<div className="p-4">
							<Card>
								<CardContent className="flex aspect-square items-center justify-center p-6">
									<Skeleton className="h-6 w-32" />
								</CardContent>
							</Card>
						</div>
						</CarouselItem>
					))}
				</CarouselContent>
			</Carousel>
			) : recipes.length === 0 ? (
				<p className="text-center text-muted-foreground text-lg py-8">Техкарт нет</p>
			) : (
			<Carousel opts={{ loop: true }} className="m-auto w-full px-6">
				<CarouselContent className="-ml-1">
					{recipes.map((recipe) => (
						<CarouselItem
						key={recipe.id}
						className="pl-1 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/6"
						>
						<div className="p-4">
							<Card
							className="cursor-pointer hover:shadow-md transition-shadow"
							onClick={() => {
								setSelectedRecipeId(recipe.id);
								setOpenDetails(true);
							}}
							>
								<CardContent className="flex aspect-square items-center justify-center p-6">
									<div className="text-center">
										<div className="text-xl font-semibold">
											{recipe.name}
										</div>
										<div className="text-md text-muted-foreground mt-1">
											остаток: {formatNum(recipe.remainingBase)} г
										</div>
										{type === "preparation" && recipe.usedInFillings?.length > 0 && (
											<div className="flex flex-wrap gap-1 justify-center mt-2">
												{recipe.usedInFillings.map((filling) => (
												<Badge
													key={filling}
													variant="secondary"
													className="text-[12px] px-2 py-0"
												>
													{filling}
												</Badge>
												))}
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						</div>
						</CarouselItem>
					))}
				</CarouselContent>
				<CarouselPrevious />
				<CarouselNext />
			</Carousel>
			)}
		</div>
	);
}