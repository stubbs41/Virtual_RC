"use client";

import * as React from "react";
import ModelCard, { type SearchResultItem } from "@/components/ModelCard";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LayoutGrid, List } from "lucide-react";

interface SearchResultsGridProps {
  results: SearchResultItem[];
  isLoading?: boolean;
}

type LayoutMode = "grid" | "list";

export default function SearchResultsGrid({ results, isLoading = false }: SearchResultsGridProps) {
  const [layout, setLayout] = React.useState<LayoutMode>("grid");

  if (isLoading) {
    return <div className="text-center py-10">Loading results...</div>;
  }

  if (!results || results.length === 0) {
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
          {results.map((model) => (
            <ModelCard key={model.url} model={model} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((model) => (
            // Enhance list view later if needed, for now just use ModelCard
            <ModelCard key={model.url} model={model} />
          ))}
        </div>
      )}
    </div>
  );
}

