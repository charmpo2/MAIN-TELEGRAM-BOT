import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import type { PetValue, PetCategory } from '../../src/adopt-me/types/pet';

const ADOPTMEVALUES_URL = 'https://www.adoptmevalues.app/values';

export async function scrapeAdoptMeValues(): Promise<PetValue[]> {
  try {
    const response = await fetch(ADOPTMEVALUES_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 30000,
    });

    if (!response.ok) {
      throw new Error(`AdoptMeValues.app fetch failed: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const pets: PetValue[] = [];

    // Look for pet grid/list items
    $('[class*="pet"], .pet-card, .value-card, [data-pet]').each((_, el) => {
      const $el = $(el);
      
      const name = $el.find('h3, h2, .pet-name, .title, [class*="name"]').first().text().trim();
      const valueText = $el.find('.value, [class*="value"], .price').first().text().trim();
      const rarityText = $el.find('[class*="rarity"], [class*="tier"]').first().text().trim();
      
      if (name && valueText) {
        const value = parseNumericValue(valueText);
        const category = parseRarity(rarityText);
        
        if (value > 0) {
          pets.push({
            id: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
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

    // Check for Next.js data script (common in React apps)
    if (pets.length === 0) {
      const nextData = $('#__NEXT_DATA__').html();
      if (nextData) {
        try {
          const data = JSON.parse(nextData);
          const petData = data.props?.pageProps?.pets || data.props?.initialState?.pets;
          
          if (Array.isArray(petData)) {
            for (const pet of petData) {
              pets.push({
                id: pet.id || pet.slug || pet.name.toLowerCase().replace(/\s+/g, '-'),
                name: pet.name,
                value: parseFloat(pet.value || pet.normalValue || 0),
                category: parseRarity(pet.rarity || pet.category),
                type: 'pet',
                rarity: parseRarity(pet.rarity || pet.category),
                lastUpdated: new Date(),
              });
            }
          }
        } catch (e) {
          console.log('[AdoptMeValues] Next.js data parse failed');
        }
      }
    }

    console.log(`[AdoptMeValues] Scraped ${pets.length} pets`);
    return pets;
  } catch (error) {
    console.error('[AdoptMeValues] Scraping error:', error);
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
