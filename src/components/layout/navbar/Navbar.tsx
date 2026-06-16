import { getServerSession } from "@/lib/auth/auth-server";
import Logo from "./Logo";
import DesktopNav from "./DesktopNav";
import MobileMenu from "./MobileMenu";
import ThemeToggle from "./ThemeToggle";
import AuthButton from "./AuthButton";
import { NAV_LINKS, filterLinksByRole, type UserRole } from "./nav-links";

export default async function Navbar() {
    const session = await getServerSession();
    const user = session?.user;
    const isAuthenticated = !!user;

    const role = user?.role as UserRole | undefined;
    const username = user?.username ?? undefined;

    const links = isAuthenticated ? filterLinksByRole(NAV_LINKS, role) : [];

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
                <Logo priority />

                <DesktopNav links={links} />

                <div className="flex items-center gap-2">
                    <ThemeToggle />

                    <div className="hidden md:block">
                        <AuthButton
                            isAuthenticated={isAuthenticated}
                            username={username}
                        />
                    </div>

                    <MobileMenu
                        links={links}
                        isAuthenticated={isAuthenticated}
                        username={username}
                    />
                </div>
            </div>
        </header>
    );
}