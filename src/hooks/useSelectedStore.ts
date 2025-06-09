import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SELECTED_STORE_KEY = 'selected_store_id';

interface UseSelectedStore {
  selectedStoreId: string | null;
  loading: boolean;
  setSelectedStoreId: (storeId: string) => Promise<void>;
  clearSelectedStore: () => Promise<void>;
}

export function useSelectedStore(): UseSelectedStore {
  const [selectedStoreId, setStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Check if running in a browser environment
  const isClient = typeof window !== 'undefined';

  useEffect(() => {
    // Skip AsyncStorage operations during SSR
    if (!isClient) {
      setLoading(false);
      return;
    }
    
    const loadSelectedStoreId = async () => {
      try {
        const storedId = await AsyncStorage.getItem(SELECTED_STORE_KEY);
        setStoreId(storedId);
      } catch (error) {
        console.error('Failed to load selected store ID:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSelectedStoreId();
  }, [isClient]);

  const setSelectedStoreId = useCallback(async (storeId: string) => {
    if (!isClient) return;
    
    setLoading(true);
    try {
      await AsyncStorage.setItem(SELECTED_STORE_KEY, storeId);
      setStoreId(storeId);
      await new Promise(resolve => setTimeout(resolve, 50)); // Small delay to ensure state update
    } catch (error) {
      console.error('Failed to save selected store ID:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isClient]);

  const clearSelectedStore = useCallback(async () => {
    if (!isClient) return;
    
    setLoading(true);
    try {
      await AsyncStorage.removeItem(SELECTED_STORE_KEY);
      setStoreId(null);
    } catch (error) {
      console.error('Failed to clear selected store ID:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isClient]);

  return { selectedStoreId, loading, setSelectedStoreId, clearSelectedStore };
} 