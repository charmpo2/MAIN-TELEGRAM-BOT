import { scrapeAMVGG } from './scrapers/scrape-amvgg';
import { scrapeElvebredd } from './scrapers/scrape-elvebredd';
import { scrapeTradingValues } from './scrapers/scrape-tradingvalues';
import { scrapeAdoptMeValues } from './scrapers/scrape-adoptmevalues';
import { scrapeDriffle } from './scrapers/scrape-driffle';
import { scrapeEldorado } from './scrapers/scrape-eldorado';

// Manual trigger endpoint for scraping all sources
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Simple auth check (optional)
  const { key } = req.query;
  if (key !== process.env.SCRAPE_KEY) {
    res.status(403).json({ error: 'Unauthorized' });
    return;
  }

  try {
    console.log('[Scrape-All] Starting manual scrape of all sources...');

    const results = await Promise.allSettled([
      scrapeAMVGG(),
      scrapeElvebredd(),
      scrapeTradingValues(),
      scrapeAdoptMeValues(),
      scrapeDriffle(),
      scrapeEldorado(),
    ]);

    const summary = {
      amvgg: results[0].status === 'fulfilled' ? (results[0] as PromiseFulfilledResult<any>).value.length : 0,
      elvebredd: results[1].status === 'fulfilled' ? (results[1] as PromiseFulfilledResult<any>).value.length : 0,
      tradingValues: results[2].status === 'fulfilled' ? (results[2] as PromiseFulfilledResult<any>).value.length : 0,
      adoptmevaluesApp: results[3].status === 'fulfilled' ? (results[3] as PromiseFulfilledResult<any>).value.length : 0,
      driffle: results[4].status === 'fulfilled' ? (results[4] as PromiseFulfilledResult<any>).value.length : 0,
      eldorado: results[5].status === 'fulfilled' ? (results[5] as PromiseFulfilledResult<any>).value.length : 0,
    };

    const failures = results
      .map((r, i) => ({ status: r.status, source: Object.keys(summary)[i], reason: r.status === 'rejected' ? (r as PromiseRejectedResult).reason : null }))
      .filter(r => r.status === 'rejected');

    res.status(200).json({
      success: true,
      summary,
      failures,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Scrape-All] Error:', error);
    res.status(500).json({
      error: 'Scraping failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
