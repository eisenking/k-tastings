import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StockCategoriesTab from "./_components/StockCategoriesTab/StockCategoriesTab";
import ProductsTab from "./_components/ProductsTab/ProductsTab";
import UsersTab from "./_components/UsersTab/UsersTab";
import ActivityTab from "./_components/ActivityTab/ActivityTab";

export default function AdminPage() {
    return (
        <section className="mt-4 w-full max-w-7xl">
            <Tabs defaultValue="users" className="items-center">
                <TabsList className="flex items-center justify-start flex-wrap h-auto space-y-1">
                    <TabsTrigger value="categories" className="mb-1">
                        Категории
                    </TabsTrigger>
                    <TabsTrigger value="products" className="mb-1">
                        Продукты
                    </TabsTrigger>
                    <TabsTrigger value="users" className="mb-1">
                        Пользователи
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="mb-1">
                        Активность
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="categories">
                    <StockCategoriesTab />
                </TabsContent>
                <TabsContent value="products">
                    <ProductsTab />
                </TabsContent>
                <TabsContent value="users">
                    <UsersTab />
                </TabsContent>
                <TabsContent value="activity">
                    <ActivityTab />
                </TabsContent>
            </Tabs>
        </section>
    );
}