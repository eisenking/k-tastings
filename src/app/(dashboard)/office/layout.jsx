import { requireRoles } from "@/lib/auth/guard";
import { ROLES } from "@/lib/constants/roles";

export default async function OfficeLayout({ children }) {
    await requireRoles([ROLES.ADMIN, ROLES.OFFICE]);
    return children;
}
