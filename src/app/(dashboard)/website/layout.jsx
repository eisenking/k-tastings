import { requireRoles } from "@/lib/auth/guard";
import { ROLES } from "@/lib/constants/roles";

export default async function WebsiteLayout({ children }) {
    await requireRoles([ROLES.ADMIN, ROLES.OFFICE]);
    return children;
}
