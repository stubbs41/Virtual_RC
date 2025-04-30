// /api/admin/roles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkUserPermission } from "@/lib/permissions";

// GET: Fetch all available roles
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check for permission (e.g., "manage:users" or a specific "view:roles")
  const hasPermission = await checkUserPermission(session.user.id, "manage:users");
  if (!hasPermission) {
    return NextResponse.json({ error: "Forbidden: You do not have permission to view roles." }, { status: 403 });
  }

  try {
    const { data: roles, error } = await supabase
      .from("roles")
      .select("id, name, description")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching roles:", error);
      throw new Error("Failed to fetch roles.");
    }

    return NextResponse.json({ roles });

  } catch (error: any) {
    console.error("GET /api/admin/roles Error:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred." }, { status: 500 });
  }
}

// Note: POST, PATCH, DELETE for roles could be added here later if needed,
// protected by a "manage:roles" permission.

