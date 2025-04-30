import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import AuthProvider from "@/components/AuthProvider";
import Header from "@/components/Header";
import FooterAdBanner from "@/components/FooterAdBanner"; // Import the FooterAdBanner
import { cn } from "@/lib/utils";

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
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <AuthProvider>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <div className="flex-1">
              {children}
            </div>
            <FooterAdBanner /> {/* Add the FooterAdBanner here */}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

