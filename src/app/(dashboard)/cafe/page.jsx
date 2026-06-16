import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductsTab from "./_components/ProductsTab/ProductsTab";

export default function Home() {
    return (
        <section className="mt-4 w-full max-w-7xl">
            <Tabs defaultValue="products" className="items-center">
                <TabsList className='flex items-center justify-start flex-wrap h-auto space-y-1'>
                    <TabsTrigger value="products">Склад</TabsTrigger>
                </TabsList>
                <TabsContent value="products">
                    <ProductsTab />
                </TabsContent>
            </Tabs>
        </section>
    );
}