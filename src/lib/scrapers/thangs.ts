import axios from 'axios';
import * as cheerio from 'cheerio'; // Cheerio might not work well if Thangs uses heavy JS rendering
import { type SearchResultItem } from '@/components/ModelCard';

const BASE_URL = 'https://thangs.com';

// Helper function to extract price - Thangs has both free and paid models
function extractPrice($: cheerio.CheerioAPI, element: cheerio.Element): string {
  // Inspect Thangs search results page for price indicators
  // Example selectors (needs verification): '.price-tag', '.model-cost'
  const priceElement = $(element).find('.price-tag'); // Adjust selector
  if (priceElement.length > 0) {
    const priceText = priceElement.text().trim();
    if (priceText.toLowerCase() === 'free') {
      return 'Free';
    }
    if (priceText.includes('$') || priceText.includes('€') || priceText.includes('£')) {
      return priceText;
    }
  }
  // Check for explicit 'Free' labels if price element is missing
  const freeLabel = $(element).find('.free-badge'); // Adjust selector
  if (freeLabel.length > 0) {
    return 'Free';
  }

  // Thangs might default to free if no price is shown
  return 'Free'; // Default assumption, needs verification
}

export async function searchThangs(query: string, options?: { price?: string }): Promise<SearchResultItem[]> {
  // Thangs search URL structure (needs verification)
  const searchUrl = `${BASE_URL}/search/${encodeURIComponent(query)}?scope=models`;
  console.log(`Scraping Thangs: ${searchUrl}`);

  try {
    const { data } = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        // Thangs might require specific headers or be heavily client-side rendered
      },
    });

    const $ = cheerio.load(data);
    const results: SearchResultItem[] = [];

    // Find the container for search results (Selector needs verification)
    // Inspect Thangs search results page to find the correct selectors
    // Example selector (likely needs adjustment): '.search-results-container .model-card'
    $('div[class*="ModelCardContainer"]').each((index, element) => { // Adjust selector based on inspection
      const titleElement = $(element).find('a[class*="ModelCardName"]'); // Adjust selector
      const title = titleElement.text().trim();
      const relativeUrl = titleElement.attr('href');
      const url = relativeUrl ? `${BASE_URL}${relativeUrl}` : '';

      // Find thumbnail (Selector needs verification)
      const thumbnailElement = $(element).find('img[class*="ModelCardThumbnail"]'); // Adjust selector
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
          source: 'Thangs',
          sourceUrl: BASE_URL,
        });
      }
    });

    console.log(`Found ${results.length} results from Thangs for query "${query}"`);
    return results;

  } catch (error) {
    // Thangs might use heavy client-side rendering, Cheerio might fail.
    // Consider Puppeteer or Playwright if Cheerio doesn't work.
    console.error(`Error scraping Thangs for query "${query}":`, error);
    return [];
  }
}

