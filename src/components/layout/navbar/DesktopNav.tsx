import type { NavLink } from "./nav-links";
import NavLinkItem from "./NavLinkItem";

type Props = {
    links: NavLink[];
};

export default function DesktopNav({ links }: Props) {
    return (
        <nav className="mx-auto hidden items-center gap-6 md:flex">
            {links.map((link) => (
                <NavLinkItem key={link.href} {...link} />
                )   
            )}
        </nav>
    );
}