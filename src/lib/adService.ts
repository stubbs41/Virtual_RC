// Placeholder for a simple Ad Service
// In a real application, this might fetch ads from a database or third-party network

import { type SponsoredResultItem } from "@/components/SponsoredResultCard";

// Dummy sponsored results data
const dummySponsoredResults: SponsoredResultItem[] = [
  {
    title: "Premium Sci-Fi Asset Pack",
    url: "https://example.com/sponsored/sci-fi-pack",
    thumbnail: "https://via.placeholder.com/300x169.png?text=Sponsored+Ad+1", // Placeholder image
    description: "High-quality 3D models for your next sci-fi project.",
    advertiser: "Awesome Assets Inc.",
    source: "Sponsored",
  },
  {
    title: "Realistic Furniture Collection",
    url: "https://example.com/sponsored/furniture-collection",
    thumbnail: "https://via.placeholder.com/300x169.png?text=Sponsored+Ad+2", // Placeholder image
    description: "Photorealistic furniture models for architectural visualization.",
    advertiser: "VisuMaster Models",
    source: "Sponsored",
  },
];

// Function to get sponsored results based on query (simple placeholder logic)
export async function getSponsoredResults(query: string): Promise<SponsoredResultItem[]> {
  console.log(`Ad Service: Fetching sponsored results for query "${query}"`);
  // Simple logic: return dummy ads if query contains certain keywords, or just return all
  // In a real app, this would involve more complex targeting
  if (query.toLowerCase().includes("sci-fi") || query.toLowerCase().includes("pack")) {
    return [dummySponsoredResults[0]];
  }
  if (query.toLowerCase().includes("furniture") || query.toLowerCase().includes("archviz")) {
    return [dummySponsoredResults[1]];
  }

  // Default: return the first dummy ad for any other query for demonstration
  if (dummySponsoredResults.length > 0) {
     return [dummySponsoredResults[0]];
  }

  return [];
}

