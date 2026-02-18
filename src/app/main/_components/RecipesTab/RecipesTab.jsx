import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RecipesCarousel from "./RecipesCarousel";
// import PreparationsBatchesTable from "./PreparationsBatchesTable";

export default async function RecipesTab() {
    return (
        <div className="space-y-6">
            <Tabs defaultValue="крем" className="items-center">
                <TabsList>
                    <TabsTrigger value="крем">Крема</TabsTrigger>
                    <TabsTrigger value="бисквит">Бисквиты</TabsTrigger>
                    <TabsTrigger value="начинка">Начинки</TabsTrigger>
                    <TabsTrigger value="пропитка">Пропитки</TabsTrigger>
                    <TabsTrigger value="другое">Прочее</TabsTrigger>
                </TabsList>

                <TabsContent value="крем">
                    <RecipesCarousel type="крем" />
                </TabsContent>

                <TabsContent value="бисквит">
                    <RecipesCarousel type="бисквит" />
                </TabsContent>

                <TabsContent value="начинка">
                    <RecipesCarousel type="начинка" />
                </TabsContent>

                <TabsContent value="пропитка">
                    <RecipesCarousel type="пропитка" />
                </TabsContent>

                <TabsContent value="другое">
                    <RecipesCarousel type="другое" />
                </TabsContent>
            </Tabs>

            {/* <PreparationsBatchesTable /> */}
        </div>
    );
}