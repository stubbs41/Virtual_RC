"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export default function SearchBar({ onSearch, isLoading = false }: SearchBarProps) {
  const [query, setQuery] = React.useState("");

  const handleSearch = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex w-full max-w-xl items-center space-x-2 mx-auto my-4">
      <Input
        type="search"
        placeholder="Search 3D models across multiple sites..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-grow"
        disabled={isLoading}
      />
      <Button type="submit" disabled={isLoading}>
        <Search className="h-4 w-4 mr-2" />
        {isLoading ? "Searching..." : "Search"}
      </Button>
    </form>
  );
}

