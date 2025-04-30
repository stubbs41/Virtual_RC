"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet"; // Assuming Sheet component is added or created
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Filter } from "lucide-react";

// Define available sources (replace with actual list later)
const ALL_SOURCES = [
  "Printables", "Makerworld", "Thingiverse", "Sketchfab",
  "CGTrader", "MyMiniFactory", "Thangs",
  // Add all 25 sources from requirements
];

export interface FilterState {
  sources: string[];
  price: "all" | "free" | "paid";
}

interface FilterPanelProps {
  initialFilters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
}

export default function FilterPanel({ initialFilters, onApplyFilters }: FilterPanelProps) {
  const [selectedSources, setSelectedSources] = React.useState<string[]>(initialFilters.sources);
  const [selectedPrice, setSelectedPrice] = React.useState<FilterState["price"]>(initialFilters.price);

  const handleSourceChange = (source: string, checked: boolean | string) => {
    setSelectedSources(prev =>
      checked ? [...prev, source] : prev.filter(s => s !== source)
    );
  };

  const handleSelectAllSources = (checked: boolean | string) => {
    setSelectedSources(checked ? ALL_SOURCES : []);
  };

  const handleApply = () => {
    onApplyFilters({ sources: selectedSources, price: selectedPrice });
  };

  const allSourcesSelected = selectedSources.length === ALL_SOURCES.length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filter Search Results</SheetTitle>
          <SheetDescription>
            Refine your search by selecting sources and price options.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4 space-y-6">
          {/* Price Filter */}
          <div className="space-y-2">
            <Label className="font-semibold">Price</Label>
            <RadioGroup value={selectedPrice} onValueChange={(value) => setSelectedPrice(value as FilterState["price"]) }>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="price-all" />
                <Label htmlFor="price-all">All</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="free" id="price-free" />
                <Label htmlFor="price-free">Free</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="paid" id="price-paid" />
                <Label htmlFor="price-paid">Paid</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Source Filter */}
          <div className="space-y-2">
            <Label className="font-semibold">Sources</Label>
            <div className="flex items-center space-x-2 pb-2 border-b">
              <Checkbox
                id="select-all-sources"
                checked={allSourcesSelected}
                onCheckedChange={handleSelectAllSources}
              />
              <Label htmlFor="select-all-sources" className="font-medium">
                Select All Sources
              </Label>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1 pr-2">
              {ALL_SOURCES.map(source => (
                <div key={source} className="flex items-center space-x-2">
                  <Checkbox
                    id={`source-${source}`}
                    checked={selectedSources.includes(source)}
                    onCheckedChange={(checked) => handleSourceChange(source, checked)}
                  />
                  <Label htmlFor={`source-${source}`}>{source}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button type="button" onClick={handleApply}>Apply Filters</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

