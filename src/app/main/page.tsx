import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductsTab from "./_components/ProductsTab/ProductsTab";
import PreparationsTab from "./_components/PreparationsTab/PreparationsTab";
import TastingsTab from "./_components/TastingsTab/TastingsTab";
import ProductionTab from "./_components/ProductionTab/ProductionTab";

export default function Home() {
    return (
        <section className="mt-4 w-full max-w-7xl">
            <Tabs defaultValue="products" className="items-center">
                <TabsList className='flex items-center justify-start flex-wrap h-auto space-y-1'>
                    <TabsTrigger value="products">Склад</TabsTrigger>
                    <TabsTrigger value="preparations">Заготовки</TabsTrigger> 
                    <TabsTrigger value="tastings">Начинки</TabsTrigger>          
                    <TabsTrigger value="production" className="mb-1">Производство</TabsTrigger>
                </TabsList>
                <TabsContent value="products">
                    <ProductsTab />
                </TabsContent>
                <TabsContent value="preparations">
                    <PreparationsTab />
                </TabsContent>
                <TabsContent value="tastings">
                    <TastingsTab />
                </TabsContent>
                <TabsContent value="production">
                    <ProductionTab />
                </TabsContent>
            </Tabs>
        </section>
    );
}