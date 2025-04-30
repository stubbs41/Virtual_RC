// /api/import/csv/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Papa from "papaparse";
import { Readable } from "stream";
import { checkUserPermission } from "@/lib/permissions"; // Import the permission checker

// Helper function to stream file content
async function streamToString(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    result += decoder.decode(value, { stream: true });
  }
  result += decoder.decode(); // Flush any remaining chunks
  return result;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check for 'import:csv' permission
  const hasPermission = await checkUserPermission(session.user.id, "import:csv");
  if (!hasPermission) {
    return NextResponse.json({ error: "Forbidden: You do not have permission to import CSV files." }, { status: 403 });
  }

  let jobId: string | null = null;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const mappingString = formData.get("mapping") as string | null;
    const delimiter = formData.get("delimiter") as string | null;

    if (!file || !mappingString || !delimiter) {
      return NextResponse.json({ error: "Missing file, mapping, or delimiter" }, { status: 400 });
    }

    const columnMapping = JSON.parse(mappingString);
    const fileContent = await streamToString(file.stream());

    // 1. Create Import Job Record
    const { data: jobData, error: jobError } = await supabase
      .from("import_jobs")
      .insert({
        initiated_by_user_id: session.user.id,
        import_type: "csv",
        source_details: { filename: file.name },
        status: "processing",
        delimiter: delimiter,
        column_mapping: columnMapping,
      })
      .select("id")
      .single();

    if (jobError || !jobData) {
      console.error("Failed to create import job:", jobError);
      throw new Error("Failed to initialize import job.");
    }
    jobId = jobData.id;

    // 2. Parse CSV
    let parseError: string | null = null;
    let parsedData: any[] = [];
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      delimiter: delimiter,
      complete: (results) => {
        if (results.errors.length > 0) {
          parseError = `CSV Parsing Error: ${results.errors[0].message}`;
        } else {
          parsedData = results.data;
        }
      },
      error: (error: Error) => {
        parseError = `CSV Parsing Failed: ${error.message}`;
      }
    });

    if (parseError) {
      throw new Error(parseError);
    }

    const totalRows = parsedData.length;
    await supabase.from("import_jobs").update({ total_rows: totalRows }).eq("id", jobId);

    // 3. Process and Insert Data
    let importedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const row of parsedData) {
      const modelData: { [key: string]: any } = {};
      let hasRequiredFields = false;

      for (const csvHeader in columnMapping) {
        const dbColumn = columnMapping[csvHeader];
        if (dbColumn && row[csvHeader] !== undefined && row[csvHeader] !== null) {
          let value = row[csvHeader].trim();

          // Basic type conversion (can be expanded)
          if (["cost_price", "retail_price"].includes(dbColumn)) {
            value = parseFloat(value) || null;
          } else if (dbColumn === "is_free") {
            value = ["true", "1", "yes"].includes(value.toLowerCase());
          } else if (["tags", "file_formats"].includes(dbColumn)) {
            // Split comma-separated strings into arrays
            value = value.split(",").map((s: string) => s.trim()).filter((s: string) => s);
          }

          modelData[dbColumn] = value;
          if (dbColumn === "title" && value) { // Assuming title is required
            hasRequiredFields = true;
          }
        }
      }

      if (!hasRequiredFields) {
        // Skip row if required fields (e.g., title) are missing/empty after mapping
        errorCount++;
        errors.push(`Skipped row due to missing required fields (e.g., title): ${JSON.stringify(row)}`);
        continue;
      }

      // Add import metadata
      modelData.imported_by_user_id = session.user.id;
      modelData.import_job_id = jobId;

      // 4. Duplicate Check (Example: based on source_url if provided and mapped)
      let isDuplicate = false;
      if (modelData.source_url) {
        const { data: existing, error: checkError } = await supabase
          .from("models")
          .select("id")
          .eq("source_url", modelData.source_url)
          .maybeSingle();

        if (checkError) {
          console.warn("Duplicate check failed:", checkError);
          // Decide how to handle: skip or attempt insert?
        }
        if (existing) {
          isDuplicate = true;
        }
      }
      // Add more sophisticated duplicate checks if needed (e.g., part_number + manufacturer)

      if (isDuplicate) {
        duplicateCount++;
        continue;
      }

      // 5. Insert into Supabase
      const { error: insertError } = await supabase.from("models").insert(modelData);

      if (insertError) {
        errorCount++;
        errors.push(`Failed to insert row: ${insertError.message} - Data: ${JSON.stringify(modelData)}`);
        console.error("Insert Error:", insertError);
      } else {
        importedCount++;
      }

      // Update job progress periodically (e.g., every 50 rows) - not implemented here for simplicity
    }

    // 6. Finalize Job Status
    const finalStatus = errorCount > 0 ? "completed_with_errors" : "completed";
    const { error: updateError } = await supabase
      .from("import_jobs")
      .update({
        status: finalStatus,
        processed_rows: totalRows,
        imported_rows: importedCount,
        duplicate_rows: duplicateCount,
        // Store first few errors for quick reference
        error_message: errors.length > 0 ? errors.slice(0, 5).join("\n") : null,
        processing_log: errors.length > 5 ? `Total errors: ${errors.length}. See full logs for details.` : null,
        // TODO: Add logic for 'awaiting_verification' status if needed
      })
      .eq("id", jobId);

    if (updateError) {
      console.error("Failed to update job status:", updateError);
      // Log this failure but proceed with response
    }

    return NextResponse.json({
      message: `Import finished with status: ${finalStatus}`,
      jobId: jobId,
      totalRows: totalRows,
      imported: importedCount,
      duplicates: duplicateCount,
      errors: errorCount,
      errorDetails: errors.slice(0, 5), // Send back first few errors
    });

  } catch (error: any) {
    console.error("CSV Import API Error:", error);
    // Update job status to failed if possible
    if (jobId) {
      await supabase
        .from("import_jobs")
        .update({ status: "failed", error_message: error.message })
        .eq("id", jobId);
    }
    return NextResponse.json({ error: error.message || "An unexpected error occurred." }, { status: 500 });
  }
}

