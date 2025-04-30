// src/lib/permissions.ts
import { supabase } from "./supabaseClient";

/**
 * Checks if a user has a specific permission based on their assigned roles.
 * 
 * @param userId The UUID of the user.
 * @param requiredPermission The name of the permission to check (e.g., "import:csv").
 * @returns True if the user has the permission, false otherwise.
 */
export async function checkUserPermission(
  userId: string | undefined,
  requiredPermission: string
): Promise<boolean> {
  if (!userId) {
    console.log("Permission check failed: No user ID provided.");
    return false;
  }

  try {
    // Query to find if any of the user's roles have the required permission
    const { data, error, count } = await supabase
      .from("user_roles")
      .select("roles!inner(role_permissions!inner(permissions!inner(name)))", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("roles.role_permissions.permissions.name", requiredPermission);

    if (error) {
      console.error("Error checking user permission:", error);
      return false;
    }

    // If count > 0, the user has at least one role with the required permission
    const hasPermission = (count ?? 0) > 0;
    console.log(`Permission check for user ${userId}, permission ${requiredPermission}: ${hasPermission}`);
    return hasPermission;

  } catch (err) {
    console.error("Unexpected error during permission check:", err);
    return false;
  }
}

