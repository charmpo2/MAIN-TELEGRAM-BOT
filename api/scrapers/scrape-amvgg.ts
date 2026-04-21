import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import type { PetValue, PetCategory } from '../../src/adopt-me/types/pet';

const AMVGG_URL = 'https://amvgg.com/values/pets';

export async function scrapeAMVGG(): Promise<PetValue[]> {
  try {
    const response = await fetch(AMVGG_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 30000,
    });

    if (!response.ok) {
      throw new Error(`AMVGG fetch failed: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const pets: PetValue[] = [];

    // AMVGG typically renders pets in cards or tables
    // This is a generalized scraper - actual selectors may need adjustment
    $('.pet-card, .value-item, [data-pet]').each((_, el) => {
      const name = $(el).find('.pet-name, .name, h3, h2').first().text().trim();
      const valueText = $(el).find('.value, .pet-value, .price').first().text().trim();
      const rarityText = $(el).find('.rarity, .category').first().text().trim().toLowerCase();
      
      if (name && valueText) {
        const value = parseNumericValue(valueText);
        const category = parseRarity(rarityText);
        
        if (value > 0) {
          pets.push({
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name,
            value,
            category,
            type: 'pet',
            rarity: category,
            lastUpdated: new Date(),
          });
        }
      }
    });

    // Fallback: Try alternative selectors
    if (pets.length === 0) {
      $('tr, .pet-row').each((_, el) => {
        const cells = $(el).find('td, .cell');
        if (cells.length >= 2) {
          const name = $(cells[0]).text().trim();
          const valueText = $(cells[1]).text().trim();
          
          if (name && valueText) {
            const value = parseNumericValue(valueText);
            if (value > 0) {
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
        }
      });
    }

    console.log(`[AMVGG] Scraped ${pets.length} pets`);
    return pets;
  } catch (error) {
    console.error('[AMVGG] Scraping error:', error);
    return [];
  }
}

function parseNumericValue(text: string): number {
  // Handle various formats like "125", "125 legendaries", "0.5", etc.
  const cleaned = text
    .toLowerCase()
    .replace(/[^\d.]/g, '')
    .trim();
  
  const value = parseFloat(cleaned);
  return isNaN(value) ? 0 : value;
}

function parseRarity(text: string): PetCategory {
  if (text.includes('legendary')) return 'legendary';
  if (text.includes('ultra')) return 'ultra-rare';
  if (text.includes('rare')) return 'rare';
  if (text.includes('uncommon')) return 'uncommon';
  return 'common';
}
