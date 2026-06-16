import { requireRoles } from "@/lib/auth/guard";
import { ROLES } from "@/lib/constants/roles";

export default async function AdminLayout({ children }) {
    await requireRoles([ROLES.ADMIN]);
    return children;
}
