import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import type { PetValue, PetCategory } from '../../src/adopt-me/types/pet';

const TRADING_VALUES_URL = 'https://adoptmetradingvalues.com/pet-value-list.php';

export async function scrapeTradingValues(): Promise<PetValue[]> {
  try {
    const response = await fetch(TRADING_VALUES_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 30000,
    });

    if (!response.ok) {
      throw new Error(`TradingValues fetch failed: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const pets: PetValue[] = [];

    // TradingValues has a traditional value list table
    // Look for table rows or pet cards
    
    $('table tr, .pet-list-item, [data-pet-id]').each((_, el) => {
      const $el = $(el);
      
      // Try multiple selector strategies
      let name = $el.find('.pet-name, .name, td:first-child, .pet-title').first().text().trim();
      let valueText = $el.find('.pet-value, .value, td:nth-child(2), .numeric').first().text().trim();
      let rarityText = $el.find('.rarity, .type, td:nth-child(3)').first().text().trim().toLowerCase();
      
      // Alternative: Check for images with alt text
      if (!name) {
        const imgAlt = $el.find('img').first().attr('alt');
        if (imgAlt) name = imgAlt;
      }
      
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

    // Try to find any embedded JSON data
    if (pets.length === 0) {
      $('script').each((_, el) => {
        const scriptContent = $(el).html() || '';
        if (scriptContent.includes('petData') || scriptContent.includes('values')) {
          try {
            const match = scriptContent.match(/(?:petData|values)\s*=\s*(\[[\s\S]*?\])/);
            if (match) {
              const data = JSON.parse(match[1]);
              if (Array.isArray(data)) {
                for (const pet of data) {
                  if (pet.name && pet.value) {
                    pets.push({
                      id: pet.id || pet.name.toLowerCase().replace(/\s+/g, '-'),
                      name: pet.name,
                      value: parseFloat(pet.value),
                      category: parseRarity(pet.rarity),
                      type: 'pet',
                      rarity: parseRarity(pet.rarity),
                      lastUpdated: new Date(),
                    });
                  }
                }
              }
            }
          } catch (e) {
            // Silent fail for JSON parse attempts
          }
        }
      });
    }

    console.log(`[TradingValues] Scraped ${pets.length} pets`);
    return pets;
  } catch (error) {
    console.error('[TradingValues] Scraping error:', error);
    return [];
  }
}

function parseNumericValue(text: string): number {
  // Handle formats like "125", "125.5", "N/A", "TBD"
  if (text.toLowerCase().includes('n/a') || text.toLowerCase().includes('tbd')) {
    return 0;
  }
  
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
  if (t.includes('ultra-rare') || t.includes('ultra')) return 'ultra-rare';
  if (t.includes('rare')) return 'rare';
  if (t.includes('uncommon')) return 'uncommon';
  return 'common';
}
