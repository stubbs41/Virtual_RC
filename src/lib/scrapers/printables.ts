import axios from 'axios';
import * as cheerio from 'cheerio';
import { type SearchResultItem } from '@/components/ModelCard'; // Assuming type is defined here or adjust path

const BASE_URL = 'https://www.printables.com';

// Helper function to extract price - Printables often implies free
function extractPrice($: cheerio.CheerioAPI, element: cheerio.Element): string {
  // Printables models are generally free, but check for any indicators if needed
  // For now, assume free unless specific paid indicators are found (unlikely on Printables)
  return 'Free';
}

export async function searchPrintables(query: string, options?: { price?: string }): Promise<SearchResultItem[]> {
  const searchUrl = `${BASE_URL}/search/models?q=${encodeURIComponent(query)}`;
  console.log(`Scraping Printables: ${searchUrl}`);

  try {
    const { data } = await axios.get(searchUrl, {
      headers: {
        // Add headers to mimic a browser if necessary
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const $ = cheerio.load(data);
    const results: SearchResultItem[] = [];

    // Find the container for search results (Selector needs verification)
    // Inspect Printables search results page to find the correct selectors
    // Example selector (likely needs adjustment): '.search-results .model-item'
    $('div[class^="SearchResultItem_"]').each((index, element) => {
      const titleElement = $(element).find('a[class^="link_"]');
      const title = titleElement.text().trim();
      const relativeUrl = titleElement.attr('href');
      const url = relativeUrl ? `${BASE_URL}${relativeUrl}` : '';

      // Find thumbnail (Selector needs verification)
      const thumbnailElement = $(element).find('img[class^="img_"]');
      const thumbnail = thumbnailElement.attr('src'); // Or 'data-src' etc.

      const price = extractPrice($, element);

      if (title && url) {
        // Apply price filter if specified
        if (options?.price && options.price !== 'all') {
          const isFree = price.toLowerCase() === 'free';
          if ((options.price === 'free' && !isFree) || (options.price === 'paid' && isFree)) {
            return; // Skip this result if it doesn't match the price filter
          }
        }

        results.push({
          title,
          url,
          thumbnail: thumbnail ? `${thumbnail}` : undefined, // Ensure thumbnail URL is absolute if needed
          price,
          source: 'Printables',
          sourceUrl: BASE_URL,
        });
      }
    });

    console.log(`Found ${results.length} results from Printables for query "${query}"`);
    return results;

  } catch (error) {
    console.error(`Error scraping Printables for query "${query}":`, error);
    // Return empty array or throw error based on desired handling
    return [];
  }
}

