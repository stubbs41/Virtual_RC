"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { checkUserPermission } from "@/lib/permissions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string>("loading");
  const [session, setSession] = React.useState<any>(null);

  // Check session and permission on mount, but only in browser
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      import("next-auth/react").then(({ useSession }) => {
        const { data, status } = useSession();
        setSession(data);
        setStatus(status);

        if (status === "unauthenticated") {
          router.push("/login");
        } else if (status === "authenticated" && data?.user?.id) {
          checkUserPermission(data.user.id, "view:admin_dashboard").then(permissionResult => {
            setHasPermission(permissionResult);
            if (!permissionResult) {
              setError("You do not have permission to view the admin dashboard.");
              // Optionally redirect: router.push("/unauthorized");
            }
          });
        }
      });
    }
  }, [router]);

  if (status === "loading" || hasPermission === null) {
    return <div className="container mx-auto p-8">Loading...</div>;
  }

  if (hasPermission === false) {
    return <div className="container mx-auto p-8 text-red-500">Error: {error || "Access Denied"}</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* User Management Card */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>View users and manage their roles.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/users" passHref>
              <Button>Go to User Management</Button>
            </Link>
          </CardContent>
        </Card>

        {/* CSV Import Card */}
        <Card>
          <CardHeader>
            <CardTitle>CSV Import</CardTitle>
            <CardDescription>Import model data from CSV files.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/import/csv" passHref>
              <Button>Go to CSV Import</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Scraping Targets Card */}
        <Card>
          <CardHeader>
            <CardTitle>Web Scraping Targets</CardTitle>
            <CardDescription>Manage target URLs for web scraping imports.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/import/scrape" passHref>
              <Button>Go to Scraping Targets</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Add more cards for other admin sections as needed */}
      </div>
    </div>
  );
}

