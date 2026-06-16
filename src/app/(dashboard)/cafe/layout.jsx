import { requireRoles } from "@/lib/auth/guard";
import { ROLES } from "@/lib/constants/roles";

export default async function CafeLayout({ children }) {
    await requireRoles([ROLES.ADMIN, ROLES.CAFE]);
    return children;
}
