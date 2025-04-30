// /api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient"; // Import Supabase client

// Import existing scraper functions
import { searchPrintables } from "@/lib/scrapers/printables";
import { searchMakerworld } from "@/lib/scrapers/makerworld";
import { searchThingiverse } from "@/lib/scrapers/thingiverse";
import { searchSketchfab } from "@/lib/scrapers/sketchfab";
import { searchCGTrader } from "@/lib/scrapers/cgtrader";
import { searchMyMiniFactory } from "@/lib/scrapers/myminifactory";
import { searchThangs } from "@/lib/scrapers/thangs";

// Define a consistent result type
interface SearchResult {
  title: string;
  source_url: string;
  thumbnail_url?: string | null;
  source_name: string;
  price?: number | string | null; // Allow string for formatted prices like "Free"
  author_name?: string | null;
  // Add other relevant fields from DB or scrapers
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  const sourcesParam = searchParams.get("sources"); // e.g., "printables,thingiverse"
  const priceFilter = searchParams.get("price"); // e.g., "free", "paid", "any"
  const categoryFilter = searchParams.get("category");

  if (!query) {
    return NextResponse.json({ error: "Query parameter \"q\" is required" }, { status: 400 });
  }

  let allResults: SearchResult[] = [];

  try {
    // --- Step 1: Query Supabase Database ---
    console.log(`Searching database for query: ${query}`);
    let dbQuery = supabase
      .from("models")
      .select(`
        title,
        source_url,
        thumbnail_url,
        source_name,
        retail_price,
        is_free,
        author_name,
        category
      `)
      // Basic text search on title and description (consider FTS later)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`); // Search title, desc, tags

    // Apply filters to DB query
    if (priceFilter === "free") {
      dbQuery = dbQuery.eq("is_free", true);
    } else if (priceFilter === "paid") {
      dbQuery = dbQuery.eq("is_free", false);
    }
    if (categoryFilter) {
      dbQuery = dbQuery.ilike("category", `%${categoryFilter}%`);
    }
    if (sourcesParam) {
        const requestedSources = sourcesParam.split(",").map(s => s.trim());
        dbQuery = dbQuery.in("source_name", requestedSources);
    }

    // Limit results for performance
    dbQuery = dbQuery.limit(50);

    const { data: dbResults, error: dbError } = await dbQuery;

    if (dbError) {
      console.error("Database search error:", dbError);
      // Don't throw, just log and proceed to scraping if needed
    } else if (dbResults && dbResults.length > 0) {
      console.log(`Found ${dbResults.length} results in database.`);
      // Format DB results to match SearchResult interface
      allResults = dbResults.map(item => ({
        title: item.title,
        source_url: item.source_url,
        thumbnail_url: item.thumbnail_url,
        source_name: item.source_name,
        price: item.is_free ? "Free" : item.retail_price,
        author_name: item.author_name,
        // Map other fields if necessary
      }));

      // If DB results are found, return them immediately
      return NextResponse.json({ results: allResults });
    }

    // --- Step 2: Fallback to Live Scraping (if no DB results) ---
    console.log("No results found in database, proceeding to live scraping.");

    const requestedSources = sourcesParam ? sourcesParam.split(",").map(s => s.trim().toLowerCase()) : null;
    const shouldScrape = (sourceName: string) => !requestedSources || requestedSources.includes(sourceName.toLowerCase());

    const scrapingPromises: Promise<SearchResult[]>[] = [];

    // Add scraping promises based on requested sources or all if none specified
    if (shouldScrape("Printables")) {
      const promise = searchPrintables(query, { price: priceFilter ? priceFilter : undefined }).then(results =>
        results.map(item => ({
          title: item.title,
          source_url: item.url,
          thumbnail_url: item.thumbnail,
          source_name: item.source || "Printables",
          price: item.price,
          author_name: null
        }))
      );
      scrapingPromises.push(promise);
    }

    if (shouldScrape("Makerworld")) {
      const promise = searchMakerworld(query, { price: priceFilter ? priceFilter : undefined }).then(results =>
        results.map(item => ({
          title: item.title,
          source_url: item.url,
          thumbnail_url: item.thumbnail,
          source_name: item.source || "Makerworld",
          price: item.price,
          author_name: null
        }))
      );
      scrapingPromises.push(promise);
    }

    if (shouldScrape("Thingiverse")) {
      const promise = searchThingiverse(query, { price: priceFilter ? priceFilter : undefined }).then(results =>
        results.map(item => ({
          title: item.title,
          source_url: item.url,
          thumbnail_url: item.thumbnail,
          source_name: item.source || "Thingiverse",
          price: item.price,
          author_name: null
        }))
      );
      scrapingPromises.push(promise);
    }

    if (shouldScrape("Sketchfab")) {
      const promise = searchSketchfab(query, { price: priceFilter ? priceFilter : undefined }).then(results =>
        results.map(item => ({
          title: item.title,
          source_url: item.url,
          thumbnail_url: item.thumbnail,
          source_name: item.source || "Sketchfab",
          price: item.price,
          author_name: null
        }))
      );
      scrapingPromises.push(promise);
    }

    if (shouldScrape("CGTrader")) {
      const promise = searchCGTrader(query, { price: priceFilter ? priceFilter : undefined }).then(results =>
        results.map(item => ({
          title: item.title,
          source_url: item.url,
          thumbnail_url: item.thumbnail,
          source_name: item.source || "CGTrader",
          price: item.price,
          author_name: null
        }))
      );
      scrapingPromises.push(promise);
    }

    if (shouldScrape("MyMiniFactory")) {
      const promise = searchMyMiniFactory(query, { price: priceFilter ? priceFilter : undefined }).then(results =>
        results.map(item => ({
          title: item.title,
          source_url: item.url,
          thumbnail_url: item.thumbnail,
          source_name: item.source || "MyMiniFactory",
          price: item.price,
          author_name: null
        }))
      );
      scrapingPromises.push(promise);
    }

    if (shouldScrape("Thangs")) {
      const promise = searchThangs(query, { price: priceFilter ? priceFilter : undefined }).then(results =>
        results.map(item => ({
          title: item.title,
          source_url: item.url,
          thumbnail_url: item.thumbnail,
          source_name: item.source || "Thangs",
          price: item.price,
          author_name: null
        }))
      );
      scrapingPromises.push(promise);
    }
    // Add other scrapers here...

    const resultsArrays = await Promise.allSettled(scrapingPromises);

    resultsArrays.forEach((result) => {
      if (result.status === "fulfilled") {
        allResults.push(...result.value);
      } else {
        console.error("Scraping error:", result.reason);
      }
    });

    // Optional: Sort or further process combined results
    // e.g., shuffle results to mix sources
    allResults.sort(() => Math.random() - 0.5);

    console.log(`Live scraping completed. Total results: ${allResults.length}`);
    return NextResponse.json({ results: allResults });

  } catch (error: any) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred during search." }, { status: 500 });
  }
}

