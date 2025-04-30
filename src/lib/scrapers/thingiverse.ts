import axios from 'axios';
import * as cheerio from 'cheerio';
import { type SearchResultItem } from '@/components/ModelCard';

const BASE_URL = 'https://www.thingiverse.com';

// Helper function to extract price - Thingiverse models are generally free
function extractPrice($: cheerio.CheerioAPI, element: cheerio.Element): string {
  // Assume free unless specific paid indicators are found
  return 'Free';
}

export async function searchThingiverse(query: string, options?: { price?: string }): Promise<SearchResultItem[]> {
  const searchUrl = `${BASE_URL}/search?q=${encodeURIComponent(query)}&type=things`;
  console.log(`Scraping Thingiverse: ${searchUrl}`);

  try {
    const { data } = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const $ = cheerio.load(data);
    const results: SearchResultItem[] = [];

    // Find the container for search results (Selector needs verification)
    // Inspect Thingiverse search results page to find the correct selectors
    // Example selector (likely needs adjustment): '.search-results .thing-card'
    $('div.ThingCard__card--').each((index, element) => { // Adjust selector based on inspection
      const titleElement = $(element).find('a.ThingCardHeader__cardNameWrapper--'); // Adjust selector
      const title = titleElement.attr('title')?.trim();
      const relativeUrl = titleElement.attr('href');
      const url = relativeUrl ? `${BASE_URL}${relativeUrl}` : '';

      // Find thumbnail (Selector needs verification)
      const thumbnailElement = $(element).find('img.ThingCardBody__cardImage--'); // Adjust selector
      let thumbnail = thumbnailElement.attr('src') || thumbnailElement.attr('data-src');

      // Thingiverse thumbnails might be relative or need processing
      if (thumbnail && !thumbnail.startsWith('http')) {
        // Handle potential base64 or relative paths if necessary
        // For now, assume it's a usable URL or needs prefixing
        // thumbnail = `${BASE_URL}${thumbnail}`; // Might not be correct
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
          source: 'Thingiverse',
          sourceUrl: BASE_URL,
        });
      }
    });

    console.log(`Found ${results.length} results from Thingiverse for query "${query}"`);
    return results;

  } catch (error) {
    console.error(`Error scraping Thingiverse for query "${query}":`, error);
    return [];
  }
}

