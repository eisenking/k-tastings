// "use client";

// import { useEffect, useState } from "react";
// import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
// import { Card, CardContent } from "@/components/ui/card";
// import { Skeleton } from "@/components/ui/skeleton";
// import AddRecipeForm from "./AddRecipeForm";
// import { getRecipesByType } from "@/app/actions/recipes/getRecipesByType";

// function formatNum(v) {
//     const n = Number(v);
//     if (!Number.isFinite(n)) return "0";
//     return n.toFixed(0);
// }

// export default function RecipesCarousel({ type }) {
//     const [recipes, setRecipes] = useState([]);
//     const [loading, setLoading] = useState(true);

//     async function fetchRecipes() {
//         setLoading(true);
//         try {
//             const data = await getRecipesByType(type);
//             setRecipes(Array.isArray(data) ? data : []);
//         } finally {
//             setLoading(false);
//         }
//     }

//     useEffect(() => {
//         fetchRecipes();
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [type]);

//     return (
//         <div className="flex flex-col px-12 gap-2">
//             <AddRecipeForm onCreated={fetchRecipes} defaultRecipeType={type} />

//             {loading ? (
//                 <Carousel opts={{ loop: true }} className="m-auto w-full px-6">
//                     <CarouselContent className="-ml-1">
//                         {Array.from({ length: 6 }).map((_, i) => (
//                             <CarouselItem key={i} className="pl-1 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/6">
//                                 <div className="p-1">
//                                     <Card>
//                                         <CardContent className="flex aspect-square items-center justify-center p-6">
//                                             <Skeleton className="h-6 w-32" />
//                                         </CardContent>
//                                     </Card>
//                                 </div>
//                             </CarouselItem>
//                         ))}
//                     </CarouselContent>
//                 </Carousel>
//             ) : recipes.length === 0 ? (
//                 <p className="text-center text-muted-foreground text-lg py-8">Техкарт нет</p>
//             ) : (
//                 <Carousel opts={{ loop: true }} className="m-auto w-full px-6">
//                     <CarouselContent className="-ml-1">
//                         {recipes.map((recipe) => (
//                             <CarouselItem
//                                 key={recipe.id}
//                                 className="pl-1 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/6"
//                             >
//                                 <div className="p-1">
//                                     <Card
//                                         className="cursor-pointer hover:shadow-md transition-shadow"
//                                         onClick={() => {
//                                             // позже: open ProduceRecipeDialog
//                                             console.log("selected recipe:", recipe);
//                                         }}
//                                     >
//                                         <CardContent className="flex aspect-square items-center justify-center p-6">
//                                             <div className="text-center">
//                                                 <div className="text-xl font-semibold">{recipe.name}</div>
//                                                 <div className="text-xs text-muted-foreground mt-1">
//                                                     остаток: {formatNum(recipe.remainingBase)} г
//                                                 </div>
//                                             </div>
//                                         </CardContent>
//                                     </Card>
//                                 </div>
//                             </CarouselItem>
//                         ))}
//                     </CarouselContent>
//                     <CarouselPrevious />
//                     <CarouselNext />
//                 </Carousel>
//             )}
//         </div>
//     );
// }


"use client";

import { useEffect, useState } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import AddRecipeForm from "./AddRecipeForm";
import DetailedRecipe from "./DetailedRecipe";
import { getRecipesByType } from "@/app/actions/recipes/getRecipesByType";

function formatNum(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return "0";
    return n.toFixed(0);
}

export default function RecipesCarousel({ type }) {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);

    const [openDetails, setOpenDetails] = useState(false);
    const [selectedRecipeId, setSelectedRecipeId] = useState(null);

    async function fetchRecipes() {
        setLoading(true);
        try {
            const data = await getRecipesByType(type);
            setRecipes(Array.isArray(data) ? data : []);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchRecipes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type]);

    return (
        <div className="flex flex-col px-12 gap-2">
            <AddRecipeForm onCreated={fetchRecipes} defaultRecipeType={type} />

            <DetailedRecipe
                open={openDetails}
                onOpenChange={setOpenDetails}
                recipeId={selectedRecipeId}
                onProduced={() => {
                    // после изготовления обновим остатки в карусели
                    fetchRecipes();
                }}
            />

            {loading ? (
                <Carousel opts={{ loop: true }} className="m-auto w-full px-6">
                    <CarouselContent className="-ml-1">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <CarouselItem key={i} className="pl-1 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/6">
                                <div className="p-1">
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
                                <div className="p-1">
                                    <Card
                                        className="cursor-pointer hover:shadow-md transition-shadow"
                                        onClick={() => {
                                            setSelectedRecipeId(recipe.id);
                                            setOpenDetails(true);
                                        }}
                                    >
                                        <CardContent className="flex aspect-square items-center justify-center p-6">
                                            <div className="text-center">
                                                <div className="text-xl font-semibold">{recipe.name}</div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    остаток: {formatNum(recipe.remainingBase)} г
                                                </div>
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