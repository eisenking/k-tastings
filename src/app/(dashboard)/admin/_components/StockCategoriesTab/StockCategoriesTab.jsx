import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LocationCategoriesSection from "./LocationCategoriesSection";

export default function StockCategoriesTab() {
    return (
        <div className="w-full">
            <Tabs defaultValue="pastry" className="w-full">
                <TabsList className="mx-auto">
                    <TabsTrigger value="pastry">Кондитерская</TabsTrigger>
                    <TabsTrigger value="cafe">Кофейня</TabsTrigger>
                </TabsList>

                <TabsContent value="pastry">
                    <LocationCategoriesSection location="pastry" />
                </TabsContent>

                <TabsContent value="cafe">
                    <LocationCategoriesSection location="cafe" />
                </TabsContent>
            </Tabs>
        </div>
    );
}