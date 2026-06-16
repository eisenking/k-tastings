import { Skeleton } from "@/components/ui/skeleton";

export function IconButtonSkeleton({ className }: { className?: string }) {
    return <Skeleton className={`h-9 w-9 rounded-md ${className ?? ""}`} />;
}

export function NavLinksSkeleton() {
    return (
        <div className="hidden items-center gap-6 md:flex">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
        </div>
    );
}