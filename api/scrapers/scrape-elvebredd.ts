import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import type { PetValue, PetCategory } from '../../src/adopt-me/types/pet';

const ELVEBREDD_URL = 'https://elvebredd.com/adopt-me-calculator';

export async function scrapeElvebredd(): Promise<PetValue[]> {
  try {
    const response = await fetch(ELVEBREDD_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 30000,
    });

    if (!response.ok) {
      throw new Error(`Elvebredd fetch failed: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const pets: PetValue[] = [];

    // Elvebredd uses a calculator interface with searchable values
    // Try to find pet listings or embedded data
    
    // Look for JSON data in script tags
    const scriptData = $('script')
      .map((_, el) => $(el).html())
      .get()
      .find(text => text && text.includes('pets') && text.includes('value'));
    
    if (scriptData) {
      try {
        const jsonMatch = scriptData.match(/\{[\s\S]*"pets"[\s\S]*\}/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          if (data.pets && Array.isArray(data.pets)) {
            for (const pet of data.pets) {
              pets.push({
                id: (pet.id || pet.name).toLowerCase().replace(/\s+/g, '-'),
                name: pet.name,
                value: parseFloat(pet.value) || 0,
                category: parseRarity(pet.rarity || 'legendary'),
                type: 'pet',
                rarity: parseRarity(pet.rarity || 'legendary'),
                lastUpdated: new Date(),
              });
            }
          }
        }
      } catch (e) {
        console.log('[Elvebredd] JSON parse failed, trying HTML fallback');
      }
    }

    // Fallback: Try HTML scraping
    if (pets.length === 0) {
      $('[class*="pet"], [class*="value"], .pet-item').each((_, el) => {
        const name = $(el).find('[class*="name"], h3, .title').first().text().trim();
        const valueText = $(el).find('[class*="value"], [class*="price"]').first().text().trim();
        
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
      });
    }

    console.log(`[Elvebredd] Scraped ${pets.length} pets`);
    return pets;
  } catch (error) {
    console.error('[Elvebredd] Scraping error:', error);
    return [];
  }
}

function parseNumericValue(text: string): number {
  const cleaned = text.toLowerCase().replace(/[^\d.]/g, '').trim();
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
