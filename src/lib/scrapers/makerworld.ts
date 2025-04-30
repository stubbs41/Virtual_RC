import axios from 'axios';
import * as cheerio from 'cheerio';
import { type SearchResultItem } from '@/components/ModelCard';

const BASE_URL = 'https://makerworld.com';

// Helper function to extract price - MakerWorld models are generally free
function extractPrice($: cheerio.CheerioAPI, element: any): string {
  // Assume free unless specific paid indicators are found
  return 'Free';
}

export async function searchMakerworld(query: string, options?: { price?: string }): Promise<SearchResultItem[]> {
  // MakerWorld search might use POST or have a different URL structure, needs verification
  // Assuming a GET request structure for now
  const searchUrl = `${BASE_URL}/en/models/search?keyword=${encodeURIComponent(query)}`;
  console.log(`Scraping MakerWorld: ${searchUrl}`);

  try {
    const { data } = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const $ = cheerio.load(data);
    const results: SearchResultItem[] = [];

    // Find the container for search results (Selector needs verification)
    // Inspect MakerWorld search results page to find the correct selectors
    // Example selector (likely needs adjustment): '.model-list .model-card'
    $('div[class*="card-item"]').each((index, element) => { // Adjust selector based on inspection
      const titleElement = $(element).find('a[class*="model-card-link"]'); // Adjust selector
      const title = titleElement.text().trim();
      const relativeUrl = titleElement.attr('href');
      const url = relativeUrl ? `${BASE_URL}${relativeUrl}` : '';

      // Find thumbnail (Selector needs verification)
      const thumbnailElement = $(element).find('img'); // Adjust selector
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
          source: 'MakerWorld',
          sourceUrl: BASE_URL,
        });
      }
    });

    console.log(`Found ${results.length} results from MakerWorld for query "${query}"`);
    return results;

  } catch (error) {
    console.error(`Error scraping MakerWorld for query "${query}":`, error);
    return [];
  }
}

