import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
    subsets: ["latin", "cyrillic"],
    variable: "--font-inter",
});

export const metadata = {
    title: {
        default: "Magnum Opus",
        template: "%s | Название проекта",
    },
    description: "Тотальный контроль",
};

export default function RootLayout({ children }) {
    return (
        <html lang="ru" suppressHydrationWarning className={inter.variable}>
            <body className="font-sans antialiased">
                <ThemeProvider>
                    <div className="min-h-screen flex flex-col items-center px-4">
                        {children}
                    </div>
                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    );
}