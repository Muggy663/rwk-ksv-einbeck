"use client";
import { useState, useEffect } from 'react';
import { dataCache } from './dataCache';

/**
 * Custom Hook für gecachte Datenabfragen
 * 
 * @param {string} dataType - Art der Daten (z.B. 'seasons', 'leagues', 'shooters')
 * @param {Function} fetchFunction - Funktion zum Abrufen der Daten
 * @param {Object} params - Parameter für die Abfrage
 * @param {Object} options - Optionen für den Cache
 * @param {number} options.ttl - Time-to-Live in Millisekunden
 * @param {boolean} options.forceRefresh - Erzwinge eine Aktualisierung, auch wenn Daten im Cache sind
 * @returns {Object} - { data, loading, error, refetch }
 */
export function useCachedQuery(dataType, fetchFunction, params = {}, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const { ttl = 5 * 60 * 1000, forceRefresh = false } = options;

  const fetchData = async (skipCache = false) => {
    const cacheKey = dataCache.generateKey(dataType, params);
    
    // Versuche, Daten aus dem Cache zu laden, wenn nicht erzwungen wird
    if (!skipCache && !forceRefresh) {
      const cachedData = dataCache.get(cacheKey);
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        setError(null);
        return;
      }
    }
    
    // Wenn keine Daten im Cache oder Aktualisierung erzwungen
    setLoading(true);
    setError(null);
    
    try {
      // Rufe die Daten ab
      const fetchedData = await fetchFunction(params);
      
      // Speichere die Daten im Cache
      dataCache.set(cacheKey, fetchedData, ttl);
      
      setData(fetchedData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(`Error fetching ${dataType}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Lade Daten beim ersten Rendern und wenn sich die Parameter ändern
  useEffect(() => {
    fetchData();
  }, [JSON.stringify(params), forceRefresh]);

  // Funktion zum manuellen Neuladen der Daten
  const refetch = () => fetchData(true);

  return { data, loading, error, refetch, lastUpdated };
}