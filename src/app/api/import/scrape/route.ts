// /api/import/scrape/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import axios from "axios";
import * as cheerio from "cheerio";
import { checkUserPermission } from "@/lib/permissions"; // Import the permission checker

// Placeholder function for actual scraping logic
// This would need to be much more robust, potentially using target.selectors
// or site-specific logic.
async function scrapeTargetUrl(url: string, selectors: any | null): Promise<any[]> {
  console.log(`Scraping URL: ${url}`);
  try {
    const { data: html } = await axios.get(url, {
        headers: {
            // Add headers to mimic a browser if necessary
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
    });
    const $ = cheerio.load(html);

    // --- Highly Simplified Example ---
    // This needs to be replaced with actual logic based on expected site structure
    // or using the provided selectors JSON.
    const results: any[] = [];

    // Example: Try finding items based on common patterns or provided selectors
    const itemSelector = selectors?.item || ".product-item" || ".card"; // Example selectors
    const titleSelector = selectors?.title || ".product-title" || ".card-title";
    const urlSelector = selectors?.url || "a"; // Link within the item
    const priceSelector = selectors?.price || ".price";
    const imageSelector = selectors?.image || "img";

    $(itemSelector).each((_index, element) => {
        const item = $(element);
        const title = item.find(titleSelector).first().text().trim();
        let source_url = item.find(urlSelector).first().attr("href");
        const priceText = item.find(priceSelector).first().text().trim();
        const thumbnail_url = item.find(imageSelector).first().attr("src");

        // Basic validation and URL resolving
        if (title && source_url) {
            try {
                source_url = new URL(source_url, url).toString(); // Resolve relative URLs
            } catch (e) { /* Ignore invalid URLs */ return; }

            results.push({
                title,
                source_url,
                // Attempt to parse price (very basic)
                retail_price: parseFloat(priceText.replace(/[^\d.]/g, "")) || null,
                thumbnail_url: thumbnail_url ? new URL(thumbnail_url, url).toString() : null,
                // Add other fields if extractable
            });
        }
    });

    console.log(`Scraped ${results.length} potential items from ${url}`);
    return results;

  } catch (error: any) {
    console.error(`Error scraping ${url}:`, error.message);
    // Don't throw here, allow job to be marked as failed with error
    return [];
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check for permission: "import:scrape"
  const hasPermission = await checkUserPermission(session.user.id, "import:scrape");
  if (!hasPermission) {
    return NextResponse.json({ error: "Forbidden: You do not have permission to trigger web scraping imports." }, { status: 403 });
  }

  let jobId: string | null = null;
  let targetId: string | null = null;

  try {
    const body = await req.json();
    targetId = body.targetId;

    if (!targetId) {
      return NextResponse.json({ error: "Missing targetId" }, { status: 400 });
    }

    // 1. Fetch Target Details
    const { data: target, error: fetchError } = await supabase
      .from("scraping_targets")
      .select("id, target_url, source_name, selectors")
      .eq("id", targetId)
      .single();

    if (fetchError || !target) {
      console.error("Failed to fetch target:", fetchError);
      throw new Error("Scraping target not found or failed to fetch.");
    }

    // Update last attempt time immediately
    await supabase.from("scraping_targets").update({ last_scrape_attempt: new Date().toISOString() }).eq("id", targetId);

    // 2. Create Import Job Record
    const { data: jobData, error: jobError } = await supabase
      .from("import_jobs")
      .insert({
        initiated_by_user_id: session.user.id,
        import_type: "web_scrape",
        source_details: { target_url: target.target_url, source_name: target.source_name, target_id: target.id },
        status: "processing",
      })
      .select("id")
      .single();

    if (jobError || !jobData) {
      console.error("Failed to create import job:", jobError);
      throw new Error("Failed to initialize import job.");
    }
    jobId = jobData.id;

    // 3. Perform Scraping (using placeholder function)
    const scrapedItems = await scrapeTargetUrl(target.target_url, target.selectors);
    const totalRows = scrapedItems.length;
    await supabase.from("import_jobs").update({ total_rows: totalRows }).eq("id", jobId);

    // 4. Process and Insert Data
    let importedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const item of scrapedItems) {
      const modelData: { [key: string]: any } = {
        ...item, // Start with scraped data
        source_name: target.source_name, // Add source name from target
        imported_by_user_id: session.user.id,
        import_job_id: jobId,
      };

      // Basic validation (e.g., require title and source_url)
      if (!modelData.title || !modelData.source_url) {
        errorCount++;
        errors.push(`Skipped item due to missing title or URL: ${JSON.stringify(item)}`);
        continue;
      }

      // Duplicate Check (based on source_url)
      const { data: existing, error: checkError } = await supabase
        .from("models")
        .select("id")
        .eq("source_url", modelData.source_url)
        .maybeSingle();

      if (checkError) {
        console.warn("Duplicate check failed:", checkError);
      }
      if (existing) {
        duplicateCount++;
        continue; // Skip duplicate
      }

      // Insert into Supabase
      const { error: insertError } = await supabase.from("models").insert(modelData);

      if (insertError) {
        errorCount++;
        errors.push(`Failed to insert item: ${insertError.message} - URL: ${modelData.source_url}`);
        console.error("Insert Error:", insertError);
      } else {
        importedCount++;
      }
    }

    // 5. Finalize Job Status & Target Update
    const finalStatus = errorCount > 0 ? "completed_with_errors" : "completed";
    const targetUpdates: { last_scrape_success?: string } = {};
    if (finalStatus === "completed" || finalStatus === "completed_with_errors") {
        targetUpdates.last_scrape_success = new Date().toISOString();
    }

    const { error: updateJobError } = await supabase
      .from("import_jobs")
      .update({
        status: finalStatus,
        processed_rows: totalRows,
        imported_rows: importedCount,
        duplicate_rows: duplicateCount,
        error_message: errors.length > 0 ? errors.slice(0, 5).join("\n") : null,
      })
      .eq("id", jobId);

    // Update target success time
    await supabase.from("scraping_targets").update(targetUpdates).eq("id", targetId);

    if (updateJobError) {
      console.error("Failed to update job status:", updateJobError);
    }

    return NextResponse.json({
      message: `Scrape job finished with status: ${finalStatus}`,
      jobId: jobId,
      totalScraped: totalRows,
      imported: importedCount,
      duplicates: duplicateCount,
      errors: errorCount,
    });

  } catch (error: any) {
    console.error("Scrape Import API Error:", error);
    const errorMsg = error.message || "An unexpected error occurred.";
    // Update job status to failed if possible
    if (jobId) {
      await supabase
        .from("import_jobs")
        .update({ status: "failed", error_message: errorMsg })
        .eq("id", jobId);
    }
    // Update target attempt time even on failure before job creation
    if (targetId && !jobId) {
         await supabase.from("scraping_targets").update({ last_scrape_attempt: new Date().toISOString() }).eq("id", targetId);
    }
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

