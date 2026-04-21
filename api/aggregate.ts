import { scrapeAMVGG } from './scrapers/scrape-amvgg';
import { scrapeElvebredd } from './scrapers/scrape-elvebredd';
import { scrapeTradingValues } from './scrapers/scrape-tradingvalues';
import { scrapeAdoptMeValues } from './scrapers/scrape-adoptmevalues';
import { scrapeDriffle } from './scrapers/scrape-driffle';
import { scrapeEldorado } from './scrapers/scrape-eldorado';
import { aggregateValues, detectNewPets, calculateMetaStats } from '../src/adopt-me/utils/aggregator';
import type { AggregatedData, AggregatedPetValue } from '../src/adopt-me/types/pet';

// Cache storage (in-memory for now, could be Redis/Vercel KV)
let cachedData: AggregatedData | null = null;
let lastFetchTime: Date | null = null;
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Check cache first
    const now = new Date();
    if (cachedData && lastFetchTime && (now.getTime() - lastFetchTime.getTime()) < CACHE_TTL) {
      console.log('[Aggregate] Returning cached data');
      res.status(200).json(cachedData);
      return;
    }

    console.log('[Aggregate] Fetching fresh data from all sources...');

    // Scrape all 6 sources in parallel
    const results = await Promise.allSettled([
      scrapeWithTimeout('amvgg', scrapeAMVGG(), 45000),
      scrapeWithTimeout('elvebredd', scrapeElvebredd(), 45000),
      scrapeWithTimeout('tradingValues', scrapeTradingValues(), 45000),
      scrapeWithTimeout('adoptmevaluesApp', scrapeAdoptMeValues(), 45000),
      scrapeWithTimeout('driffle', scrapeDriffle(), 45000),
      scrapeWithTimeout('eldorado', scrapeEldorado(), 45000),
    ]);

    const rawSources = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => r.value)
      .filter(s => s.pets.length > 0);

    const failedSources = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map(r => r.reason);

    if (failedSources.length > 0) {
      console.log('[Aggregate] Some sources failed:', failedSources.map(e => e.message || e));
    }

    if (rawSources.length === 0) {
      // No sources succeeded, try to return cached data even if stale
      if (cachedData) {
        console.log('[Aggregate] All sources failed, returning stale cache');
        res.status(200).json({
          ...cachedData,
          meta: {
            ...cachedData.meta,
            stale: true,
          },
        });
        return;
      }

      res.status(503).json({
        error: 'All data sources unavailable',
        message: 'Unable to fetch data from any source. Please try again later.',
      });
      return;
    }

    // Aggregate the data
    const aggregated = aggregateValues(rawSources);
    const stats = calculateMetaStats(aggregated);

    // Detect new pets (compare with previous data)
    const previousPets = cachedData?.pets || null;
    const newPets = detectNewPets(aggregated, previousPets);

    // Build final response
    const responseData: AggregatedData = {
      meta: {
        lastUpdated: now.toISOString(),
        sourceCount: rawSources.length,
        ...stats,
      },
      pets: aggregated,
      newPets,
    };

    // Update cache
    cachedData = responseData;
    lastFetchTime = now;

    console.log(`[Aggregate] Successfully aggregated ${aggregated.length} pets from ${rawSources.length} sources`);
    
    res.status(200).json(responseData);
  } catch (error) {
    console.error('[Aggregate] Error:', error);
    
    // Return cached data on error if available
    if (cachedData) {
      res.status(200).json({
        ...cachedData,
        meta: {
          ...cachedData.meta,
          stale: true,
        },
      });
      return;
    }

    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function scrapeWithTimeout(
  source: string,
  promise: Promise<any>,
  timeoutMs: number
): Promise<{ source: string; pets: any[]; timestamp: Date }> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`${source} timeout`)), timeoutMs);
  });

  try {
    const pets = await Promise.race([promise, timeoutPromise]);
    return {
      source,
      pets,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error(`[${source}] Failed:`, error);
    return {
      source,
      pets: [],
      timestamp: new Date(),
    };
  }
}
