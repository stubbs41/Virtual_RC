"use client";

import * as React from "react";
import dynamic from 'next/dynamic';
import SearchBar from "@/components/SearchBar";
import { type SearchResultItem } from "@/components/ModelCard";
import { type SponsoredResultItem } from "@/components/SponsoredResultCard";
import FilterPanel, { type FilterState } from "@/components/FilterPanel";

// Dynamically import components that might cause hydration issues
const SearchResultsWithAds = dynamic(() => import("@/components/SearchResultsWithAds"), { ssr: false });

// Import function with dynamic import to avoid SSR issues
const getSponsoredResults = async (query: string) => {
  const { getSponsoredResults } = await import("@/lib/adService");
  return getSponsoredResults(query);
};

// Define the structure of the API response
interface ApiResponse {
  results: SearchResultItem[];
  metadata: {
    query: string;
    sourcesSearched: string[];
    totalResults: number;
    currentPage: number;
  };
}

// Default filters
const defaultFilters: FilterState = {
  sources: [], // Start with no sources selected, user must opt-in via filter panel
  price: "all",
};

export default function HomePage() {
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [filters, setFilters] = React.useState<FilterState>(defaultFilters);
  const [results, setResults] = React.useState<SearchResultItem[]>([]);
  const [sponsoredResults, setSponsoredResults] = React.useState<SponsoredResultItem[]>([]); // State for sponsored results
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchResults = async (query: string, currentFilters: FilterState) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResults([]);
    setSponsoredResults([]); // Clear previous sponsored results

    try {
      const params = new URLSearchParams();
      params.append("q", query.trim());
      if (currentFilters.price !== "all") {
        params.append("price", currentFilters.price);
      }
      if (currentFilters.sources.length > 0) {
        params.append("sources", currentFilters.sources.join(","));
      }

      // Dynamically import axios if needed
      const axiosModule = await import('axios');
      const axiosInstance = axiosModule.default;

      // Fetch regular results and sponsored results in parallel
      const [resultsResponse, sponsoredResponse] = await Promise.all([
        axiosInstance.get<ApiResponse>(`/api/search?${params.toString()}`),
        getSponsoredResults(query.trim()), // Fetch sponsored results
      ]);

      setResults(resultsResponse.data.results || []);
      setSponsoredResults(sponsoredResponse || []);

    } catch (err) {
      console.error("Failed to fetch search results or sponsored content:", err);
      setError("Failed to fetch search results. Please try again.");
      setResults([]);
      setSponsoredResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    fetchResults(query, filters);
  };

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
    if (searchQuery) {
      fetchResults(searchQuery, newFilters);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <SearchBar onSearch={handleSearch} isLoading={isLoading} />

      <div className="mt-4 mb-6 flex justify-end">
        <FilterPanel initialFilters={filters} onApplyFilters={handleApplyFilters} />
      </div>

      {error && (
        <div className="text-center py-10 text-red-600">
          Error: {error}
        </div>
      )}

      {/* Use SearchResultsWithAds component */}
      <SearchResultsWithAds
        results={results}
        sponsoredResults={sponsoredResults}
        isLoading={isLoading}
      />
    </main>
  );
}
