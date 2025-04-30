// /api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkUserPermission } from "@/lib/permissions";

// GET: Fetch all users with their roles
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check for permission: "manage:users"
  const hasPermission = await checkUserPermission(session.user.id, "manage:users");
  if (!hasPermission) {
    return NextResponse.json({ error: "Forbidden: You do not have permission to view users." }, { status: 403 });
  }

  try {
    // Fetch users and their assigned roles
    // Note: Supabase Auth users are separate from our profiles table initially.
    // We fetch from our profiles table which should be populated by the trigger.
    // We also join with user_roles and roles.
    const { data: users, error } = await supabase
      .from("profiles") // Use profiles table which mirrors auth.users
      .select(`
        id,
        email,
        name,
        user_roles ( roles ( id, name ) )
      `)
      .order("email", { ascending: true });

    if (error) {
      console.error("Error fetching users:", error);
      throw new Error("Failed to fetch users.");
    }

    // Format the data slightly for easier frontend use
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.user_roles.map((ur: any) => ur.roles).filter(Boolean) // Extract roles array
    }));

    return NextResponse.json({ users: formattedUsers });

  } catch (error: any) {
    console.error("GET /api/admin/users Error:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred." }, { status: 500 });
  }
}

// PATCH: Update a user's roles
export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for permission: "manage:users"
    const hasPermission = await checkUserPermission(session.user.id, "manage:users");
    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to manage users." }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const userIdToUpdate = searchParams.get("id");
        const { roleIds } = await req.json(); // Expecting an array of role IDs

        if (!userIdToUpdate) {
            return NextResponse.json({ error: "Missing user ID in query parameters" }, { status: 400 });
        }
        if (!Array.isArray(roleIds)) {
            return NextResponse.json({ error: "Invalid input: roleIds must be an array." }, { status: 400 });
        }

        // Use a transaction to ensure atomicity: delete existing, insert new
        const { error: transactionError } = await supabase.rpc("update_user_roles", {
            target_user_id: userIdToUpdate,
            new_role_ids: roleIds
        });

        if (transactionError) {
            console.error("Error updating user roles via RPC:", transactionError);
            throw new Error("Failed to update user roles.");
        }

        // Fetch the updated user data to return
        const { data: updatedUser, error: fetchError } = await supabase
            .from("profiles")
            .select(`id, email, name, user_roles ( roles ( id, name ) )`)
            .eq("id", userIdToUpdate)
            .single();

        if (fetchError || !updatedUser) {
             console.error("Failed to fetch updated user data:", fetchError);
             // Return success even if fetching updated data fails, as the update likely succeeded
             return NextResponse.json({ message: "Roles updated successfully, but failed to fetch updated user data." });
        }

        const formattedUser = {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            roles: updatedUser.user_roles.map((ur: any) => ur.roles).filter(Boolean)
        };

        return NextResponse.json({ user: formattedUser });

    } catch (error: any) {
        console.error("PATCH /api/admin/users Error:", error);
        return NextResponse.json({ error: error.message || "An unexpected error occurred." }, { status: 500 });
    }
}

