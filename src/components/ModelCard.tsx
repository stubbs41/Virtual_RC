"use client";

import * as React from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // Assuming Badge component is added or created
import { Heart } from "lucide-react"; // For favorite button

// Define the structure of a search result item
export interface SearchResultItem {
  title: string;
  url: string;
  thumbnail?: string;
  price?: string;
  source?: string;
  sourceUrl?: string;
}

interface ModelCardProps {
  model: SearchResultItem;
  isFavorite?: boolean;
  onToggleFavorite?: (model: SearchResultItem) => void; // Add later for favorite functionality
}

export default function ModelCard({ model, isFavorite = false, onToggleFavorite }: ModelCardProps) {
  const handleFavoriteClick = () => {
    if (onToggleFavorite) {
      onToggleFavorite(model);
    }
  };

  // Basic price check for badge color
  const isFree = model.price?.toLowerCase() === "free";

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader className="p-0 relative">
        {model.thumbnail ? (
          <Image
            src={model.thumbnail}
            alt={model.title}
            width={300} // Adjust as needed
            height={200} // Adjust as needed
            className="object-cover w-full h-48" // Fixed height for consistency
            unoptimized // If using external images not configured in next.config
            onError={(e) => (e.currentTarget.style.display = 'none')} // Hide image on error
          />
        ) : (
          <div className="h-48 bg-secondary flex items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-semibold mb-1 leading-tight truncate" title={model.title}>
          {model.title}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground truncate" title={model.source}>
          Source: {model.source || "N/A"}
        </CardDescription>
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center">
        {model.price && (
          <Badge variant={isFree ? "default" : "secondary"}>
            {model.price}
          </Badge>
        )}
        <div className="flex space-x-2">
          {/* Favorite button - functionality to be added later */}
          {/* <Button variant="outline" size="icon" onClick={handleFavoriteClick} title="Add to favorites">
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
          </Button> */}
          <Button asChild size="sm">
            <a href={model.url} target="_blank" rel="noopener noreferrer">
              View
            </a>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

