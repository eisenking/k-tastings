import { Badge } from "@/components/ui/badge";
import { fmtG } from "../utils/format";

export default function PreparationsRow({ title, need, used, deficit }) {
    return (
        <div className="rounded-md border p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="font-medium">{title}</div>
            <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">
                <Badge variant="secondary">нужно: {fmtG(need)}</Badge>
                <Badge variant="outline">закрыли со склада: {fmtG(used)}</Badge>
                {deficit > 0 ? (
                    <Badge variant="destructive">произвести: {fmtG(deficit)}</Badge>
                ) : (
                    <Badge variant="secondary">ок</Badge>
                )}
            </div>
        </div>
    );
}