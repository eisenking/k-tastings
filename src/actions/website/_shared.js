import { requireUser } from "@/lib/auth/session";
import { assertCanManageWebsite } from "@/lib/auth/rbac";

/** Auth + RBAC для всех website actions (admin, office). */
export async function requireWebsiteManager() {
    const user = await requireUser();
    assertCanManageWebsite(user);
    return user;
}
