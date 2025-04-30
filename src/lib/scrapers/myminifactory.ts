import axios from 'axios';
import * as cheerio from 'cheerio';
import { type SearchResultItem } from '@/components/ModelCard';

const BASE_URL = 'https://www.myminifactory.com';

// Helper function to extract price from MyMiniFactory results
function extractPrice($: cheerio.CheerioAPI, element: cheerio.Element): string {
  // Inspect MyMiniFactory search results page for price indicators
  // Example selectors (needs verification): '.price', '.product-price'
  const priceElement = $(element).find('.product-price'); // Adjust selector
  if (priceElement.length > 0) {
    const priceText = priceElement.text().trim();
    if (priceText.toLowerCase().includes('free')) {
      return 'Free';
    }
    if (priceText.includes('$') || priceText.includes('€') || priceText.includes('£')) {
      return priceText;
    }
  }
  // Check for explicit 'Free' badges/labels
  const freeBadge = $(element).find('.free-object-badge'); // Adjust selector
  if (freeBadge.length > 0) {
    return 'Free';
  }

  return 'Price unavailable'; // Default if no price info found
}

export async function searchMyMiniFactory(query: string, options?: { price?: string }): Promise<SearchResultItem[]> {
  // MyMiniFactory search URL structure (needs verification)
  const searchUrl = `${BASE_URL}/search/?query=${encodeURIComponent(query)}`;
  console.log(`Scraping MyMiniFactory: ${searchUrl}`);

  try {
    const { data } = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const $ = cheerio.load(data);
    const results: SearchResultItem[] = [];

    // Find the container for search results (Selector needs verification)
    // Inspect MyMiniFactory search results page to find the correct selectors
    // Example selector (likely needs adjustment): '.search-results .card', '.object-card'
    $('div.object-card').each((index, element) => { // Adjust selector based on inspection
      const titleElement = $(element).find('a.card-title'); // Adjust selector
      const title = titleElement.text().trim();
      const relativeUrl = titleElement.attr('href');
      const url = relativeUrl ? `${BASE_URL}${relativeUrl}` : '';

      // Find thumbnail (Selector needs verification)
      const thumbnailElement = $(element).find('img.card-img-top'); // Adjust selector
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
          source: 'MyMiniFactory',
          sourceUrl: BASE_URL,
        });
      }
    });

    console.log(`Found ${results.length} results from MyMiniFactory for query "${query}"`);
    return results;

  } catch (error) {
    console.error(`Error scraping MyMiniFactory for query "${query}":`, error);
    return [];
  }
}

