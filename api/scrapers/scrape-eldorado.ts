import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import type { PetValue, PetCategory } from '../../src/adopt-me/types/pet';

const ELDORADO_URL = 'https://www.eldorado.gg/blog/adopt-me-trading-values/';

export async function scrapeEldorado(): Promise<PetValue[]> {
  try {
    const response = await fetch(ELDORADO_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 30000,
    });

    if (!response.ok) {
      throw new Error(`Eldorado fetch failed: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const pets: PetValue[] = [];

    // Eldorado has blog-style tables and structured content
    
    // Look for tables with pet data
    $('table tbody tr, .pet-table tr, [class*="value"] tr').each((_, el) => {
      const $el = $(el);
      const cells = $el.find('td, th');
      
      if (cells.length >= 2) {
        const name = $(cells[0]).text().trim();
        const valueText = $(cells[1]).text().trim();
        
        // Eldorado often lists MFR/NFR values
        const mfrText = cells.length > 2 ? $(cells[2]).text().trim() : '';
        const nfrText = cells.length > 3 ? $(cells[3]).text().trim() : '';
        
        if (name && valueText) {
          const value = parseNumericValue(valueText);
          
          if (value > 0) {
            const pet: PetValue = {
              id: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
              name,
              value,
              category: 'legendary',
              type: 'pet',
              rarity: 'legendary',
              lastUpdated: new Date(),
            };
            
            // If MFR value is available, calculate it
            if (mfrText) {
              const mfrValue = parseNumericValue(mfrText);
              if (mfrValue > 0) {
                // Store as mega value (we'll calculate from it)
                // Normal value = MFR / 16 roughly, but we use provided normal value
              }
            }
            
            pets.push(pet);
          }
        }
      }
    });

    // Try to find structured list content
    if (pets.length === 0) {
      $('h2, h3, .heading').each((_, el) => {
        const $heading = $(el);
        const headingText = $heading.text().trim().toLowerCase();
        
        // Look for pet sections
        if (headingText.includes('pet') || headingText.includes('value')) {
          const $list = $heading.next('ul, ol');
          $list.find('li').each((_, li) => {
            const text = $(li).text().trim();
            const match = text.match(/([A-Za-z\s-]+)[-:]\s*(\d[\d,]*\.?\d*)/);
            
            if (match) {
              const name = match[1].trim();
              const value = parseFloat(match[2].replace(/,/g, ''));
              
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
      });
    }

    console.log(`[Eldorado] Scraped ${pets.length} pets`);
    return pets;
  } catch (error) {
    console.error('[Eldorado] Scraping error:', error);
    return [];
  }
}

function parseNumericValue(text: string): number {
  // Handle formats like "1,250", "1250", "$1250", "1250$"
  const cleaned = text
    .replace(/[$,]/g, '')
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
