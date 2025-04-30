import axios from 'axios';
import * as cheerio from 'cheerio';
import { type SearchResultItem } from '@/components/ModelCard';

const BASE_URL = 'https://www.cgtrader.com';

// Helper function to extract price from CGTrader results
function extractPrice($: cheerio.CheerioAPI, element: cheerio.Element): string {
  // Inspect CGTrader search results page for price indicators
  // Example selectors (needs verification): '.item-price', '.price-tag__price'
  const priceElement = $(element).find('.item-price'); // Adjust selector
  if (priceElement.length > 0) {
    const priceText = priceElement.text().trim();
    if (priceText.toLowerCase() === 'free') {
      return 'Free';
    }
    if (priceText.includes('$') || priceText.includes('€') || priceText.includes('£')) {
      return priceText;
    }
  }
  // Check for explicit 'Free' labels if price element is missing or doesn't contain currency
  const freeLabel = $(element).find('.label-free'); // Adjust selector
  if (freeLabel.length > 0) {
    return 'Free';
  }

  return 'Price unavailable'; // Default if no price info found
}

export async function searchCGTrader(query: string, options?: { price?: string }): Promise<SearchResultItem[]> {
  // CGTrader search URL structure (needs verification)
  const searchUrl = `${BASE_URL}/3d-models?keywords=${encodeURIComponent(query)}`;
  console.log(`Scraping CGTrader: ${searchUrl}`);

  try {
    const { data } = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const $ = cheerio.load(data);
    const results: SearchResultItem[] = [];

    // Find the container for search results (Selector needs verification)
    // Inspect CGTrader search results page to find the correct selectors
    // Example selector (likely needs adjustment): '.content-list__item', '.js-search-item-wrapper'
    $('div.content-list__item').each((index, element) => { // Adjust selector based on inspection
      const titleElement = $(element).find('a.item-link'); // Adjust selector
      const title = titleElement.attr('title')?.trim();
      const relativeUrl = titleElement.attr('href');
      const url = relativeUrl ? `${BASE_URL}${relativeUrl}` : '';

      // Find thumbnail (Selector needs verification)
      const thumbnailElement = $(element).find('img.img-responsive'); // Adjust selector
      let thumbnail = thumbnailElement.attr('src') || thumbnailElement.attr('data-original');

      // Ensure thumbnail URL is absolute
      if (thumbnail && !thumbnail.startsWith('http')) {
        // CGTrader thumbnails might be relative or need prefixing
        // thumbnail = `${BASE_URL}${thumbnail}`; // Check if needed
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
          source: 'CGTrader',
          sourceUrl: BASE_URL,
        });
      }
    });

    console.log(`Found ${results.length} results from CGTrader for query "${query}"`);
    return results;

  } catch (error) {
    console.error(`Error scraping CGTrader for query "${query}":`, error);
    return [];
  }
}

