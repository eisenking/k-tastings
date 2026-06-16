import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrdersTab from "@/app/(dashboard)/office/_components/OrdersTab/OrdersTab";

export default function OfficePage() {
    return (
        <section className="mt-4 w-full max-w-7xl">
            <Tabs defaultValue="orders" className="items-center">
                <TabsList className='flex items-center justify-start flex-wrap h-auto space-y-1'>
                    <TabsTrigger value="orders" className="mb-1">Заказы</TabsTrigger>
                </TabsList>
                <TabsContent value="orders">
                    <OrdersTab />
                </TabsContent>
            </Tabs>
        </section>
    );
}