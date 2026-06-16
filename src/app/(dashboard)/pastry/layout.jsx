import { requireRoles } from "@/lib/auth/guard";
import { ROLES } from "@/lib/constants/roles";

export default async function PastryLayout({ children }) {
    await requireRoles([ROLES.ADMIN, ROLES.PASTRY]);
    return children;
}
