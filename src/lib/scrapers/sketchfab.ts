import axios from 'axios';
import * as cheerio from 'cheerio';
import { type SearchResultItem } from '@/components/ModelCard';

const BASE_URL = 'https://sketchfab.com';

// Helper function to extract price from Sketchfab results
function extractPrice($: cheerio.CheerioAPI, element: cheerio.Element): string {
  // Inspect Sketchfab search results page for price indicators
  // Example selector (needs verification): '.model-price', '.price-tag'
  const priceElement = $(element).find('.price'); // Adjust selector
  if (priceElement.length > 0) {
    const priceText = priceElement.text().trim();
    // Check if it explicitly says "Free" or contains a currency symbol
    if (priceText.toLowerCase() === 'free') {
      return 'Free';
    }
    if (priceText.includes('$') || priceText.includes('€') || priceText.includes('£')) {
      return priceText; // Return the formatted price
    }
  }
  // If no price element found, or it doesn't indicate paid, assume free (or handle as needed)
  // Sketchfab often defaults to showing price, absence might mean free or error
  return 'Free'; // Default assumption, might need refinement
}

export async function searchSketchfab(query: string, options?: { price?: string }): Promise<SearchResultItem[]> {
  // Sketchfab search URL structure (needs verification)
  const searchUrl = `${BASE_URL}/search?q=${encodeURIComponent(query)}&type=models`;
  console.log(`Scraping Sketchfab: ${searchUrl}`);

  try {
    const { data } = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        // Sketchfab might require more specific headers or use client-side rendering
      },
    });

    const $ = cheerio.load(data);
    const results: SearchResultItem[] = [];

    // Find the container for search results (Selector needs verification)
    // Inspect Sketchfab search results page to find the correct selectors
    // Example selector (likely needs adjustment): '.models-grid .model-card'
    $('div.model-card-wrapper').each((index, element) => { // Adjust selector based on inspection
      const titleElement = $(element).find('a.card-model__name'); // Adjust selector
      const title = titleElement.text().trim();
      const relativeUrl = titleElement.attr('href');
      const url = relativeUrl ? `${BASE_URL}${relativeUrl}` : '';

      // Find thumbnail (Selector needs verification)
      const thumbnailElement = $(element).find('img.card-model__thumb'); // Adjust selector
      let thumbnail = thumbnailElement.attr('src') || thumbnailElement.attr('data-src');

      // Ensure thumbnail URL is absolute
      if (thumbnail && !thumbnail.startsWith('http')) {
        thumbnail = `${BASE_URL}${thumbnail}`;
      }

      const price = extractPrice($, element);

      if (title && url) {
        // Apply price filter if specified
        if (options?.price && options.price !== 'all') {
          const isFree = price.toLowerCase() === 'free';
          if ((options.price === 'free' && !isFree) || (options.price === 'paid' && isFree)) {
            return; // Skip
          }
        }

        results.push({
          title,
          url,
          thumbnail: thumbnail || undefined,
          price,
          source: 'Sketchfab',
          sourceUrl: BASE_URL,
        });
      }
    });

    console.log(`Found ${results.length} results from Sketchfab for query "${query}"`);
    return results;

  } catch (error) {
    // Sketchfab often uses heavy client-side rendering, Cheerio might fail.
    // Consider Puppeteer or Playwright if Cheerio doesn't work.
    console.error(`Error scraping Sketchfab for query "${query}":`, error);
    return [];
  }
}

