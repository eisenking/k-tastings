import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductsTab from "@/app/(dashboard)/website/_components/ProductsTab/ProductsTab";
import OrdersTab from "@/app/(dashboard)/website/_components/OrdersTab/OrdersTab";
import UsersTab from "@/app/(dashboard)/website/_components/UsersTab/UsersTab";
import StatisticsTab from "@/app/(dashboard)/website/_components/StatisticsTab/StatisticsTab";

export default function SitePage() {
    return (
        <section className="mt-4 w-full max-w-7xl">
            <Tabs defaultValue="products" className="items-center">
                <TabsList className='flex items-center justify-start flex-wrap h-auto space-y-1'>
                    <TabsTrigger value="products" className="mb-1">Товары</TabsTrigger>
                    <TabsTrigger value="orders" className="mb-1">Заказы</TabsTrigger>
                    <TabsTrigger value="users" className="mb-1">Пользователи</TabsTrigger>
                    <TabsTrigger value="statistics" className="mb-1">Статистика</TabsTrigger>
                </TabsList>
                <TabsContent value="products">
                    <ProductsTab />
                </TabsContent>
                <TabsContent value="orders">
                    <OrdersTab />
                </TabsContent>
                <TabsContent value="users">
                    <UsersTab />
                </TabsContent>
                <TabsContent value="statistics">
                    <StatisticsTab />
                </TabsContent>
            </Tabs>
        </section>
    );
}