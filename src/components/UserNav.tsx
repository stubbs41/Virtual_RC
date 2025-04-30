"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from 'next/dynamic';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User, Heart } from "lucide-react";

// Use React.useState and useEffect to handle session state
export default function UserNav() {
  const [session, setSession] = React.useState<any>(null);
  const [status, setStatus] = React.useState<string>("loading");

  React.useEffect(() => {
    // Only run in browser
    if (typeof window !== "undefined") {
      import("next-auth/react").then(({ useSession, signIn, signOut }) => {
        const { data, status } = useSession();
        setSession(data);
        setStatus(status);

        // Make signIn and signOut available globally for this component
        (window as any).signIn = signIn;
        (window as any).signOut = signOut;
      });
    }
  }, []);

  if (status === "loading") {
    // Optional: Render a loading state
    return <div className="h-8 w-20 animate-pulse bg-muted rounded-md"></div>;
  }

  if (!session) {
    return (
      <Button asChild variant="outline">
        <Link href="/login">
          <LogIn className="mr-2 h-4 w-4" /> Login
        </Link>
      </Button>
    );
  }

  const user = session.user;
  const fallbackName = user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.image || undefined} alt={user?.name || user?.email || "User avatar"} />
            <AvatarFallback>{fallbackName}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* Add links to Profile and Favorites pages later */}
        {/* <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/favorites">
            <Heart className="mr-2 h-4 w-4" />
            <span>Favorites</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator /> */}
        <DropdownMenuItem onClick={() => {
          if (typeof window !== "undefined" && (window as any).signOut) {
            (window as any).signOut({ callbackUrl: "/" });
          }
        }}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

