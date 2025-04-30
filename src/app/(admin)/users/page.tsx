"use client";

import * as React from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { checkUserPermission } from "@/lib/permissions"; // Import permission checker

type Role = {
  id: string;
  name: string;
  description?: string;
};

type User = {
  id: string;
  email: string | null;
  name: string | null;
  roles: Role[];
};

export default function UserManagementPage() {
  const router = useRouter();
  const [users, setUsers] = React.useState<User[]>([]);
  const [allRoles, setAllRoles] = React.useState<Role[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = React.useState<string[]>([]);
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
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
          checkUserPermission(data.user.id, "manage:users").then(permissionResult => {
            setHasPermission(permissionResult);
            if (!permissionResult) {
              setError("You do not have permission to manage users.");
              // Optionally redirect: router.push("/unauthorized");
            }
          });
        }
      });
    }
  }, [router]);

  const fetchData = React.useCallback(async () => {
    if (hasPermission === false) return; // Don't fetch if no permission
    setIsLoading(true);
    setError(null);
    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/roles"),
      ]);

      if (!usersResponse.ok) {
        const errData = await usersResponse.json();
        throw new Error(errData.error || "Failed to fetch users");
      }
      if (!rolesResponse.ok) {
        const errData = await rolesResponse.json();
        throw new Error(errData.error || "Failed to fetch roles");
      }

      const usersData = await usersResponse.json();
      const rolesData = await rolesResponse.json();

      setUsers(usersData.users || []);
      setAllRoles(rolesData.roles || []);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [hasPermission]);

  // Fetch data when permission is confirmed
  React.useEffect(() => {
    if (hasPermission === true) {
      fetchData();
    }
  }, [hasPermission, fetchData]);

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setSelectedRoleIds(user.roles.map(role => role.id));
  };

  const handleRoleChange = (roleId: string, checked: boolean | string) => {
    if (checked) {
      setSelectedRoleIds(prev => [...prev, roleId]);
    } else {
      setSelectedRoleIds(prev => prev.filter(id => id !== roleId));
    }
  };

  const saveRoleChanges = async () => {
    if (!editingUser) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users?id=${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleIds: selectedRoleIds }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to update roles");
      }

      // Refresh user list on success
      fetchData();
      setEditingUser(null); // Close dialog implicitly via DialogClose or manually

    } catch (err: any) {
      setError(err.message); // Show error within the dialog or globally
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || hasPermission === null) {
    return <div className="container mx-auto p-8">Loading...</div>;
  }

  if (hasPermission === false) {
    return <div className="container mx-auto p-8 text-red-500">Error: {error || "Access Denied"}</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <h1 className="text-2xl font-bold">User Management</h1>

      {error && <p className="text-red-500 mb-4">Error: {error}</p>}
      {isLoading && users.length === 0 && <p>Loading users...</p>}
      {!isLoading && users.length === 0 && <p>No users found.</p>}

      {users.length > 0 && (
        <div className="overflow-x-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email || "N/A"}</TableCell>
                  <TableCell>{user.name || "N/A"}</TableCell>
                  <TableCell>
                    {user.roles.length > 0
                      ? user.roles.map(role => role.name).join(", ")
                      : "None"}
                  </TableCell>
                  <TableCell>
                    <Dialog onOpenChange={(open) => !open && setEditingUser(null)}> {/* Reset editing user on close */}
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(user)}>
                          Edit Roles
                        </Button>
                      </DialogTrigger>
                      {editingUser && editingUser.id === user.id && (
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Roles for {editingUser.email}</DialogTitle>
                            <DialogDescription>
                              Select the roles to assign to this user.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-2 py-4">
                            {allRoles.map((role) => (
                              <div key={role.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`role-${role.id}`}
                                  checked={selectedRoleIds.includes(role.id)}
                                  onCheckedChange={(checked) => handleRoleChange(role.id, checked)}
                                />
                                <Label htmlFor={`role-${role.id}`}>{role.name}</Label>
                              </div>
                            ))}
                          </div>
                          {error && <p className="text-red-500 text-sm">Error: {error}</p>}
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button onClick={saveRoleChanges} disabled={isLoading}>
                              {isLoading ? "Saving..." : "Save Changes"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      )}
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

