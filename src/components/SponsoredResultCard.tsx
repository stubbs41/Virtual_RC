"use client";

import * as React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

// Define the structure for a sponsored result item
export interface SponsoredResultItem {
  title: string;
  url: string;
  thumbnail?: string;
  description?: string; // Optional description for sponsored content
  advertiser: string; // Name of the advertiser
  source: string; // Indicate it's sponsored
}

interface SponsoredResultCardProps {
  model: SponsoredResultItem;
}

export default function SponsoredResultCard({ model }: SponsoredResultCardProps) {
  return (
    <Card className="overflow-hidden border-2 border-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/10 dark:border-yellow-600">
      <CardHeader className="p-0 relative">
        {/* Sponsored Badge */}
        <Badge variant="secondary" className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 dark:bg-yellow-600 dark:text-yellow-100">Sponsored</Badge>
        {/* Thumbnail */}
        <div className="aspect-video w-full overflow-hidden bg-muted">
          {model.thumbnail ? (
            <img
              src={model.thumbnail}
              alt={`Thumbnail for ${model.title}`}
              className="object-cover w-full h-full transition-transform duration-300 ease-in-out group-hover:scale-105"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No Image
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-lg font-semibold mb-1 leading-tight truncate" title={model.title}>
          {model.title}
        </CardTitle>
        {model.description && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{model.description}</p>
        )}
        <p className="text-xs text-muted-foreground">by {model.advertiser}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-end">
        <Button asChild size="sm" variant="outline">
          <a href={model.url} target="_blank" rel="noopener noreferrer">
            Visit Site <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}

