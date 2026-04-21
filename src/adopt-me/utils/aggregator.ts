import type { AggregatedPetValue, PetValue, ConfidenceLevel } from '../types/pet';
import { normalizePetName } from './normalizer';

export interface RawSourceData {
  source: string;
  pets: PetValue[];
  timestamp: Date;
}

export function aggregateValues(sources: RawSourceData[]): AggregatedPetValue[] {
  // Create a map of normalized pet names to their values from each source
  const petMap = new Map<string, Map<string, number>>();
  const petInfo = new Map<string, { name: string; category: any; type: any }>();
  
  // Collect all values per pet per source
  for (const source of sources) {
    for (const pet of source.pets) {
      const normalizedId = normalizePetName(pet.id || pet.name);
      
      if (!petMap.has(normalizedId)) {
        petMap.set(normalizedId, new Map());
        petInfo.set(normalizedId, {
          name: pet.name,
          category: pet.category,
          type: pet.type,
        });
      }
      
      petMap.get(normalizedId)!.set(source.source, pet.value);
    }
  }
  
  // Calculate consensus values
  const aggregated: AggregatedPetValue[] = [];
  
  for (const [id, sourceValues] of petMap) {
    const values = Array.from(sourceValues.values()).filter(v => v > 0);
    const sourceCount = values.length;
    
    if (sourceCount === 0) continue;
    
    const consensus = values.reduce((a, b) => a + b, 0) / sourceCount;
    const variance = sourceCount > 1 ? Math.max(...values) - Math.min(...values) : 0;
    const variancePercent = sourceCount > 1 ? (variance / consensus) * 100 : 0;
    
    const confidence = calculateConfidence(sourceCount, variancePercent);
    const info = petInfo.get(id)!;
    
    // Build sources object
    const sourcesObj: any = {};
    for (const [sourceName, value] of sourceValues) {
      sourcesObj[sourceName] = value;
    }
    
    aggregated.push({
      id,
      name: info.name,
      category: info.category,
      type: info.type,
      consensus: Math.round(consensus),
      sources: sourcesObj,
      sourceCount,
      variance: Math.round(variance),
      variancePercent: Math.round(variancePercent * 10) / 10,
      confidence,
      neonConsensus: Math.round(consensus * 3),
      megaConsensus: Math.round(consensus * 4.5),
      lastUpdated: new Date(),
    });
  }
  
  return aggregated.sort((a, b) => b.consensus - a.consensus);
}

function calculateConfidence(sourceCount: number, variancePercent: number): ConfidenceLevel {
  if (sourceCount >= 5 && variancePercent < 10) return 'very-high';
  if (sourceCount >= 4 && variancePercent < 15) return 'high';
  if (sourceCount >= 3 && variancePercent < 25) return 'medium';
  if (sourceCount >= 2) return 'low';
  return 'single';
}

export function detectNewPets(
  current: AggregatedPetValue[],
  previous: AggregatedPetValue[] | null
) {
  if (!previous) {
    return current.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      detectedAt: new Date().toISOString(),
      confidence: p.confidence,
    }));
  }
  
  const previousIds = new Set(previous.map(p => p.id));
  
  return current
    .filter(p => !previousIds.has(p.id))
    .map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      detectedAt: new Date().toISOString(),
      confidence: p.confidence,
    }));
}

export function calculateMetaStats(aggregated: AggregatedPetValue[]) {
  const withConsensus = aggregated.filter(p => p.sourceCount >= 2).length;
  const singleSource = aggregated.filter(p => p.sourceCount === 1).length;
  
  return {
    totalPets: aggregated.length,
    petsWithConsensus: withConsensus,
    petsSingleSource: singleSource,
  };
}
