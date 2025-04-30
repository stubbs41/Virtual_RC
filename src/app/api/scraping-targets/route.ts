// /api/scraping-targets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkUserPermission } from "@/lib/permissions"; // Import the permission checker

// GET: Fetch all scraping targets
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check for permission (e.g., "view:scraping_targets" or "manage:scraping_targets")
  // Assuming anyone who can manage can also view
  const hasPermission = await checkUserPermission(session.user.id, "manage:scraping_targets");
  if (!hasPermission) {
    // Check for a specific view permission if needed, otherwise forbid
    // const canView = await checkUserPermission(session.user.id, "view:scraping_targets");
    // if (!canView) {
         return NextResponse.json({ error: "Forbidden: You do not have permission to view scraping targets." }, { status: 403 });
    // }
  }

  try {
    const { data: targets, error } = await supabase
      .from("scraping_targets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching scraping targets:", error);
      throw new Error("Failed to fetch scraping targets.");
    }

    return NextResponse.json({ targets });

  } catch (error: any) {
    console.error("GET /api/scraping-targets Error:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred." }, { status: 500 });
  }
}

// POST: Create a new scraping target
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check for permission: "manage:scraping_targets"
  const hasPermission = await checkUserPermission(session.user.id, "manage:scraping_targets");
  if (!hasPermission) {
    return NextResponse.json({ error: "Forbidden: You do not have permission to manage scraping targets." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { target_url, source_name, is_active, frequency, selectors } = body;

    if (!target_url || !source_name) {
      return NextResponse.json({ error: "Missing required fields: target_url, source_name" }, { status: 400 });
    }

    // Validate frequency if provided (basic check)
    if (frequency && typeof frequency !== "string") {
        return NextResponse.json({ error: "Invalid frequency format. Use PostgreSQL interval string (e.g., \'1 day\')." }, { status: 400 });
    }

    const { data: newTarget, error } = await supabase
      .from("scraping_targets")
      .insert({
        target_url,
        source_name,
        is_active: is_active ?? true,
        frequency: frequency || null,
        selectors: selectors || null,
        created_by_user_id: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating scraping target:", error);
      // Handle potential unique constraint violation on target_url
      if (error.code === "23505") { // Unique violation code in PostgreSQL
        return NextResponse.json({ error: "Target URL already exists." }, { status: 409 });
      }
      throw new Error("Failed to create scraping target.");
    }

    return NextResponse.json({ target: newTarget }, { status: 201 });

  } catch (error: any) {
    console.error("POST /api/scraping-targets Error:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred." }, { status: 500 });
  }
}

// PATCH: Update a scraping target (e.g., toggle active status)
export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for permission: "manage:scraping_targets"
    const hasPermission = await checkUserPermission(session.user.id, "manage:scraping_targets");
    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to manage scraping targets." }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const targetId = searchParams.get("id");
        const body = await req.json();

        if (!targetId) {
            return NextResponse.json({ error: "Missing target ID in query parameters" }, { status: 400 });
        }

        // Only allow updating specific fields for now (e.g., is_active)
        const updates: { is_active?: boolean, frequency?: string | null, selectors?: any | null, source_name?: string } = {};
        if (body.hasOwnProperty("is_active") && typeof body.is_active === "boolean") {
            updates.is_active = body.is_active;
        }
        // Add other updatable fields if needed (e.g., frequency, selectors, source_name)
        // if (body.hasOwnProperty("frequency")) { updates.frequency = body.frequency; }
        // if (body.hasOwnProperty("selectors")) { updates.selectors = body.selectors; }
        // if (body.hasOwnProperty("source_name")) { updates.source_name = body.source_name; }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: "No valid fields provided for update" }, { status: 400 });
        }

        const { data: updatedTarget, error } = await supabase
            .from("scraping_targets")
            .update(updates)
            .eq("id", targetId)
            .select()
            .single();

        if (error) {
            console.error("Error updating scraping target:", error);
            throw new Error("Failed to update scraping target.");
        }

        if (!updatedTarget) {
            return NextResponse.json({ error: "Target not found" }, { status: 404 });
        }

        return NextResponse.json({ target: updatedTarget });

    } catch (error: any) {
        console.error("PATCH /api/scraping-targets Error:", error);
        return NextResponse.json({ error: error.message || "An unexpected error occurred." }, { status: 500 });
    }
}

// TODO: Implement DELETE later if needed

