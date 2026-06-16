import Navbar from "@/components/layout/navbar/Navbar";
import { requireSession } from "@/lib/auth/guard";

export default async function DashboardLayout({ children }) {
    await requireSession();

    return (
        <>
            <Navbar />
            {children}
        </>
    );
}
