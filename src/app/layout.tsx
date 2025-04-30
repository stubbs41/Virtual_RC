import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import Header from "@/components/Header";
import AuthProvider from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "3D Model Search Aggregator",
  description: "Search across multiple 3D model platforms",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`min-h-screen bg-background font-sans antialiased ${inter.className}`}>
        <AuthProvider>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <div className="flex-1">
              {children}
            </div>
            <footer className="border-t py-6 md:py-0">
              <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
                <p className="text-center text-sm text-muted-foreground md:text-left">
                  &copy; {new Date().getFullYear()} 3D Model Search Aggregator. All rights reserved.
                </p>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

