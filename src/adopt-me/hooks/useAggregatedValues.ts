import { useState, useEffect, useCallback } from 'react';
import type { AggregatedData, AggregatedPetValue } from '../types/pet';

const CACHE_KEY = 'adoptMeValueCache';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour client-side cache
const API_URL = '/api/aggregate';

interface UseAggregatedValuesReturn {
  data: AggregatedData | null;
  pets: AggregatedPetValue[];
  newPets: AggregatedPetValue[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  lastUpdated: Date | null;
}

export function useAggregatedValues(): UseAggregatedValuesReturn {
  const [data, setData] = useState<AggregatedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);

    try {
      // Check localStorage cache first
      if (!force) {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            const cacheTime = new Date(parsed.meta?.lastUpdated || 0);
            const now = new Date();
            
            if (now.getTime() - cacheTime.getTime() < CACHE_TTL) {
              console.log('[useAggregatedValues] Using cached data');
              setData(parsed);
              setLoading(false);
              return;
            }
          } catch (e) {
            // Invalid cache, continue to fetch
          }
        }
      }

      // Fetch from API
      console.log('[useAggregatedValues] Fetching fresh data...');
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const freshData: AggregatedData = await response.json();
      
      // Save to cache
      localStorage.setItem(CACHE_KEY, JSON.stringify(freshData));
      setData(freshData);
    } catch (err) {
      console.error('[useAggregatedValues] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      
      // Try to use stale cache on error
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setData(parsed);
        } catch (e) {
          // No valid cache available
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter new pets from the full list
  const newPetsList = data?.newPets
    .map(np => data.pets.find(p => p.id === np.id))
    .filter((p): p is AggregatedPetValue => !!p) || [];

  return {
    data,
    pets: data?.pets || [],
    newPets: newPetsList,
    loading,
    error,
    refetch: () => fetchData(true),
    lastUpdated: data?.meta?.lastUpdated ? new Date(data.meta.lastUpdated) : null,
  };
}
