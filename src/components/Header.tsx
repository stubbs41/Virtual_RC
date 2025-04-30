import Link from "next/link";
import UserNav from "@/components/UserNav";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            {/* Add logo later if needed */}
            <span className="hidden font-bold sm:inline-block">
              3D Model Search
            </span>
          </Link>
          {/* Add main navigation links here if needed */}
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center">
            <UserNav />
          </nav>
        </div>
      </div>
    </header>
  );
}

