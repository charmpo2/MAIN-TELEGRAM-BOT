import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import type { PetValue, PetCategory } from '../../src/adopt-me/types/pet';

const DRIFFLE_URL = 'https://driffle.com/blog/adopt-me-pet-trading-values/';

export async function scrapeDriffle(): Promise<PetValue[]> {
  try {
    const response = await fetch(DRIFFLE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 30000,
    });

    if (!response.ok) {
      throw new Error(`Driffle fetch failed: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const pets: PetValue[] = [];

    // Driffle typically has blog-style lists or tables
    // Try to find pet listings in tables or list items
    
    $('table tr, .pet-row, [class*="pet"]').each((_, el) => {
      const $el = $(el);
      
      // Try to find name and value in cells
      const cells = $el.find('td, .cell');
      if (cells.length >= 2) {
        const name = $(cells[0]).text().trim();
        const valueText = $(cells[1]).text().trim();
        const rarityText = cells.length > 2 ? $(cells[2]).text().trim() : '';
        
        if (name && valueText) {
          const value = parseNumericValue(valueText);
          if (value > 0) {
            pets.push({
              id: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
              name,
              value,
              category: parseRarity(rarityText),
              type: 'pet',
              rarity: parseRarity(rarityText),
              lastUpdated: new Date(),
            });
          }
        }
      }
    });

    // Fallback: Look for structured data in lists
    if (pets.length === 0) {
      $('li, .list-item').each((_, el) => {
        const text = $(el).text().trim();
        
        // Pattern: "Pet Name - Value" or "Pet Name: Value"
        const match = text.match(/^([A-Za-z\s]+)[-:]\s*(\d+\.?\d*)/);
        if (match) {
          const name = match[1].trim();
          const value = parseFloat(match[2]);
          
          if (name && value > 0) {
            pets.push({
              id: name.toLowerCase().replace(/\s+/g, '-'),
              name,
              value,
              category: 'legendary',
              type: 'pet',
              rarity: 'legendary',
              lastUpdated: new Date(),
            });
          }
        }
      });
    }

    console.log(`[Driffle] Scraped ${pets.length} pets`);
    return pets;
  } catch (error) {
    console.error('[Driffle] Scraping error:', error);
    return [];
  }
}

function parseNumericValue(text: string): number {
  const cleaned = text
    .toLowerCase()
    .replace(/[^\d.]/g, '')
    .trim();
  
  const value = parseFloat(cleaned);
  return isNaN(value) ? 0 : value;
}

function parseRarity(text: string): PetCategory {
  const t = text.toLowerCase();
  if (t.includes('legendary')) return 'legendary';
  if (t.includes('ultra')) return 'ultra-rare';
  if (t.includes('rare')) return 'rare';
  if (t.includes('uncommon')) return 'uncommon';
  return 'common';
}
