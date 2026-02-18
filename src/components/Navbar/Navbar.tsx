// 'use client'
// import Link from 'next/link';
// import Image from "next/image";
// import { useTheme } from 'next-themes'
// import { Moon, Sun, Menu, LogOut } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import {
//     Sheet,
//     SheetContent,
//     SheetTrigger,
//     SheetTitle,
// } from '@/components/ui/sheet';

// export default function Navbar() {
//     const { theme, setTheme } = useTheme();

//     const isAuthenticated = true;

//     const toggleTheme = () => {
//         setTheme(theme === 'dark' ? 'light' : 'dark')
//     };

//     return (
//         <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
//             <div className="mx-auto flex h-16 max-w-7xl justify-between items-center px-4">
//                 <Link href="/">
//                     <Image src="/logo.svg" alt="Логотип" width={70} height={70} />
//                 </Link>
//                 <nav className="mx-auto hidden items-center gap-8 md:flex">
//                     <Link
//                         href="#item1"
//                         className="text-sm font-medium hover:text-primary"
//                     >
//                         Пункт1
//                     </Link>
//                     <Link
//                         href="#item2"
//                         className="text-sm font-medium hover:text-primary"
//                     >
//                         Пункт2
//                     </Link>
//                 </nav>
//                 <div className="flex items-center gap-2">
//                     <Button
//                         variant="ghost"
//                         size="icon"
//                         onClick={toggleTheme}
//                         aria-label="Toggle theme"
//                     >
//                         {theme === 'dark' ? (
//                             <Sun className="h-5 w-5" />
//                         ) : (
//                             <Moon className="h-5 w-5" />
//                         )}
//                     </Button>

//                     {isAuthenticated ? (
//                         <Button variant="ghost" size="icon">
//                             <LogOut className="h-5 w-5" />
//                         </Button>
//                     ) : (
//                         <Button asChild className="hidden md:inline-flex">
//                             <Link href="/login">Войти</Link>
//                         </Button>
//                     )}
//                     <Sheet>
//                         <SheetTrigger asChild>
//                             <Button
//                                 variant="ghost"
//                                 size="icon"
//                                 className="md:hidden"
//                             >
//                                 <Menu className="h-5 w-5" />
//                             </Button>
//                         </SheetTrigger>
//                         <SheetContent side="right">
//                             <SheetTitle>Меню</SheetTitle>
//                             <div className="flex flex-col gap-6 pt-8">
//                                 <Link href="#item1" className="text-lg font-medium">
//                                     Пункт1
//                                 </Link>
//                                 <Link href="#item2" className="text-lg font-medium">
//                                     Пункт2
//                                 </Link>

//                                 {isAuthenticated ? (
//                                     <Button variant="outline">
//                                         Выйти
//                                     </Button>
//                                 ) : (
//                                     <Button asChild>
//                                         <Link href="/login">Войти</Link>
//                                     </Button>
//                                 )}
//                             </div>
//                         </SheetContent>
//                     </Sheet>
//                 </div>
//             </div>
//         </header>
//     )
// }


'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from "next/image";
import { useTheme } from 'next-themes';
import { Moon, Sun, Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle,
} from '@/components/ui/sheet';

import { authClient } from '@/lib/auth-client';
import { useEffect, useState } from 'react';

export default function Navbar() {
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const session = authClient.useSession(); 

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

    const handleSignOut = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push('/');
                }
            }
        });
    };

    const handleSignIn = async () => {
        // например, если у тебя есть своя страница входа
        // можно использовать redirect
        window.location.href = '/login';
    };

    const isAuthenticated = !!session.data?.user;

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-7xl justify-between items-center px-4">
                <Link href="/">
                    <Image src="/logo.svg" alt="Логотип" width={70} height={70} />
                </Link>

                <nav className="mx-auto hidden items-center gap-8 md:flex">
                    {/* <Link href="#item1" className="text-sm font-medium hover:text-primary">
                        Пункт1
                    </Link>
                    <Link href="#item2" className="text-sm font-medium hover:text-primary">
                        Пункт2
                    </Link> */}
                    <h3>Здравствуйте, {session.data?.user.username}!</h3>
                </nav>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </Button>

                    {isAuthenticated ? (
                        <Button variant="ghost" size="icon" onClick={handleSignOut}>
                            <LogOut className="h-5 w-5" />
                        </Button>
                    ) : (
                        <Button variant="ghost" size="icon" onClick={handleSignIn}>
                            <Sun className="h-5 w-5" />
                        </Button>
                    )}

                    {/* мобильное меню */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right">
                            <SheetTitle>Меню</SheetTitle>
                            <div className="flex flex-col gap-6 pt-8">
                                <Link href="#item1" className="text-lg font-medium">
                                    Пункт1
                                </Link>
                                <Link href="#item2" className="text-lg font-medium">
                                    Пункт2
                                </Link>

                                {isAuthenticated ? (
                                    <Button variant="outline" onClick={handleSignOut}>
                                        Выйти
                                    </Button>
                                ) : (
                                    <Button variant="outline" onClick={handleSignIn}>
                                        Войти
                                    </Button>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
