// "use client";
// import { useState, useEffect } from "react";
// import { format } from "date-fns";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Separator } from "@/components/ui/separator";
// import { RefreshCcw } from "lucide-react";

// import DateRangePicker from "@/components/DateRangePicker/DateRangePicker";
// import { getOrders } from "@/app/actions/orders/getOrders";

// function cx(...xs) {
//     return xs.filter(Boolean).join(" ");
// }

// export default function OrdersTab() {
//     const [range, setRange] = useState(() => {
//         const d = new Date();
//         return { from: d, to: d };
//     });

//     const [orders, setOrders] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState("");

//     async function loadAll(nextRange = range) {
//         if (!nextRange?.from) return;

//         setLoading(true);
//         setError("");

//         try {
//             const from = format(nextRange.from, "yyyy-MM-dd");
//             const to = nextRange?.to
//                 ? format(nextRange.to, "yyyy-MM-dd")
//                 : from;

//             const data = await getOrders({ from, to });
//             console.log("yay"), data;

//             setOrders(data);
//         } catch (e) {
//             console.error(e);
//             setError(e?.message || "Ошибка загрузки заказов");
//         } finally {
//             setLoading(false);
//         }
//     }

//     useEffect(() => {
//         loadAll();
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, []);

//     return (
//         <div className="space-y-4">
//             <Card className="py-0">
//                 <CardContent className="p-4 space-y-3">
//                     <div className="flex flex-col md:flex-row md:items-end gap-3 justify-center">
//                         <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
//                             <div className="space-y-1">
//                                 <DateRangePicker value={range} onChange={setRange} />
//                             </div>

//                             <Button
//                                 variant="outline"
//                                 className="gap-2"
//                                 onClick={() => loadAll()}
//                                 disabled={loading || !range?.from}
//                             >
//                                 <RefreshCcw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
//                                 Обновить
//                             </Button>

//                             <Button
//                                 variant="outline"
//                                 onClick={() => {
//                                     const d = new Date();
//                                     const nextRange = { from: d, to: d };
//                                     setRange(nextRange);
//                                     loadAll(nextRange);
//                                 }}
//                             >
//                                 Сегодня
//                             </Button>
//                         </div>
//                     </div>

//                     <Separator />

//                     {error ? (
//                         <div className="text-sm text-red-500">{error}</div>
//                     ) : null}

//                     <div className="space-y-2">
//                         {loading ? (
//                             <div className="text-sm text-muted-foreground">
//                                 Загрузка...
//                             </div>
//                         ) : orders.length === 0 ? (
//                             <div className="text-sm text-muted-foreground">
//                                 Заказы не найдены
//                             </div>
//                         ) : (
//                             orders.map((order) => (
//                                 <div
//                                     key={order.id}
//                                     className="rounded-md border p-3 flex flex-col gap-1"
//                                 >
//                                     <div className="font-medium">
//                                         {order.number || `Заказ #${order.id}`}
//                                     </div>

//                                     <div className="text-sm text-muted-foreground">
//                                         Статус: {order.status || "—"}
//                                     </div>

//                                     <div className="text-sm text-muted-foreground">
//                                         Сумма: {order.total || "0"}
//                                     </div>

//                                     <div className="text-sm text-muted-foreground">
//                                         Дата:{" "}
//                                         {order.createdAt
//                                             ? new Date(order.createdAt).toLocaleString("ru-RU")
//                                             : "—"}
//                                     </div>
//                                 </div>
//                             ))
//                         )}
//                     </div>
//                 </CardContent>
//             </Card>
//         </div>
//     );
// }

export default function OrdersTab() {
    return (
        <div>OrdersTab</div>
    )
}