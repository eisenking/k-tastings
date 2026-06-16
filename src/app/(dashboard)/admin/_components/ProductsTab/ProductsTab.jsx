import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LocationProductsSection from "./LocationProductsSection";

export default function ProductsTab() {
    return (
        <div className="w-full">
            <Tabs defaultValue="pastry" className="w-full">
                <TabsList className="mx-auto mb-2">
                    <TabsTrigger value="pastry">Кондитерская</TabsTrigger>
                    <TabsTrigger value="cafe">Кофейня</TabsTrigger>
                </TabsList>

                <TabsContent value="pastry">
                    <LocationProductsSection location="pastry" />
                </TabsContent>

                <TabsContent value="cafe">
                    <LocationProductsSection location="cafe" />
                </TabsContent>
            </Tabs>
        </div>
    );
}