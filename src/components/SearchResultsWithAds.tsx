"use client";

import * as React from "react";
import ModelCard, { type SearchResultItem } from "@/components/ModelCard";
import SponsoredResultCard, { type SponsoredResultItem } from "@/components/SponsoredResultCard";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LayoutGrid, List } from "lucide-react";

interface SearchResultsWithAdsProps {
  results: SearchResultItem[];
  sponsoredResults?: SponsoredResultItem[]; // Optional sponsored results
  isLoading?: boolean;
}

type LayoutMode = "grid" | "list";

// Function to intersperse sponsored results (simple example: add one at the beginning)
function intersperseAds(results: SearchResultItem[], sponsored: SponsoredResultItem[]): (SearchResultItem | SponsoredResultItem)[] {
  const combined: (SearchResultItem | SponsoredResultItem)[] = [...results];
  if (sponsored && sponsored.length > 0) {
    // Example: Insert the first sponsored result at the beginning
    combined.unshift(sponsored[0]);
    // More sophisticated logic could place ads at specific intervals
  }
  return combined;
}

export default function SearchResultsWithAds({ results, sponsoredResults = [], isLoading = false }: SearchResultsWithAdsProps) {
  const [layout, setLayout] = React.useState<LayoutMode>("grid");

  if (isLoading) {
    return <div className="text-center py-10">Loading results...</div>;
  }

  const combinedResults = intersperseAds(results, sponsoredResults);

  if (!combinedResults || combinedResults.length === 0) {
    return <div className="text-center py-10 text-muted-foreground">No results found.</div>;
  }

  const handleLayoutChange = (value: string) => {
    if (value === "grid" || value === "list") {
      setLayout(value as LayoutMode);
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <ToggleGroup type="single" value={layout} onValueChange={handleLayoutChange} aria-label="Layout mode">
          <ToggleGroupItem value="grid" aria-label="Grid layout">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List layout">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {layout === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {combinedResults.map((item, index) => {
            // Check if the item is a sponsored result (e.g., by checking for a unique property like 'advertiser')
            if (\'advertiser\' in item) {
              return <SponsoredResultCard key={`sponsored-${index}-${item.url}`} model={item as SponsoredResultItem} />;
            } else {
              return <ModelCard key={`model-${index}-${item.url}`} model={item as SearchResultItem} />;
            }
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {combinedResults.map((item, index) => {
             if (\'advertiser\' in item) {
              return <SponsoredResultCard key={`sponsored-${index}-${item.url}`} model={item as SponsoredResultItem} />;
            } else {
              // Enhance list view later if needed, for now just use ModelCard
              return <ModelCard key={`model-${index}-${item.url}`} model={item as SearchResultItem} />;
            }
          })}
        </div>
      )}
    </div>
  );
}

