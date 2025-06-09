import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { LocationInfo } from '../src/types';
import { supabase } from '../src/lib/supabaseClient';
import { useSelectedStore } from '../src/hooks/useSelectedStore';
import { router } from 'expo-router';

// ** IMPORTANT: This ID comes from your 'stores' table and determines which locations are fetched. **
// It should be the actual ID of the store brand this app is for.
const APP_BRAND_STORE_ID = 'c178a844-e53c-4755-8f1a-449b9c5f6abe';

export default function ChooseLocationScreen() {
  const [locations, setLocations] = useState<LocationInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setSelectedStoreId: setSelectedLocationId, loading: settingLocation } = useSelectedStore();
  const [isNavigating, setIsNavigating] = useState(false);

  // Defined at component level to be accessible by useEffect and retry button
  const loadAndProcessLocations = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('locations')
        .select('id, name, street_address')
        .eq('store_id', APP_BRAND_STORE_ID)
        .order('name');

      if (fetchError) {
        throw fetchError;
      }

      const fetchedLocations = (data || []).map(loc => ({
        id: loc.id,
        name: loc.name,
        street_address: loc.street_address,
      })) as LocationInfo[];

      console.log('Fetched locations:', JSON.stringify(fetchedLocations, null, 2));

      if (fetchedLocations.length === 1) {
        // Call handleLocationSelect directly without awaiting if it sets loading state
        // or manages its own loading/error states effectively.
        await handleLocationSelect(fetchedLocations[0].id);
        // If navigation is successful, this component will unmount or further updates might not be needed.
        // If handleLocationSelect sets its own error and loading states, we might not need to do more here.
        return; // Exit early, assuming handleLocationSelect handles navigation/state
      } else {
        setLocations(fetchedLocations);
        setLoading(false);
      }
    } catch (e: any) {
      console.error('Error fetching or processing locations:', e);
      setError(e.message || 'Failed to fetch or process locations');
      setLoading(false);
    }
  };
  
  const handleLocationSelect = async (locationId: string) => {
    // Prevent multiple executions while navigating
    if (isNavigating) {
      console.log('[handleLocationSelect] Already navigating, ignoring duplicate call');
      return;
    }

    console.log(`[select-store.tsx] handleLocationSelect called with ID: ${locationId}`);
    console.log(`[handleLocationSelect] Attempting to select location ID: ${locationId}`);
    
    try {
      setIsNavigating(true);
      console.log(`[handleLocationSelect] Calling setSelectedLocationId with: ${locationId}`);
      await setSelectedLocationId(locationId);
      console.log(`[handleLocationSelect] setSelectedLocationId successful. Stored ID: ${locationId}`);
      
      // Add a small delay to ensure state is properly saved
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force reload using window.location.replace instead of href
      if (typeof window !== 'undefined') {
        console.log('[handleLocationSelect] Forcing page reload...');
        window.location.replace('/');
      }
      
    } catch (e) {
      console.error('[handleLocationSelect] Failed to set or navigate:', e);
      setError('Failed to select location. Please try again.');
      setLoading(false);
      setIsNavigating(false);
    }
  };

  useEffect(() => {
    loadAndProcessLocations();
  }, []); // APP_BRAND_STORE_ID is a const, no other deps needed here for now.

  if (loading || settingLocation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Loading locations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadAndProcessLocations} // Now correctly calls the function in scope
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // If locations.length is 0 AND we are not loading, it means either no locations were found
  // (and it wasn't a single location case that auto-navigated), or an error occurred previously.
  // The error case is handled above. This handles the "no locations found" case after successful fetch.
  if (locations.length === 0 && !loading) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.centered}>
                <Text>No locations found for this store.</Text>
                {/* Optionally, add a retry button here too if it makes sense */} 
            </View>
        </SafeAreaView>
    );
  }

  // Only render the list if there are multiple locations and no loading/error
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Location</Text>
      </View>
      
      <FlatList
        data={locations} // This will only have items if count > 1 or count === 0 (handled above)
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.storeItem}
            onPress={() => handleLocationSelect(item.id)}
          >
            <Text style={styles.storeName}>{item.name}</Text>
            {item.street_address && <Text style={styles.locationAddress}>{item.street_address}</Text>}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  storeItem: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4a90e2',
  },
  storeName: {
    fontSize: 18,
    fontWeight: '500',
  },
  locationAddress: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
}); 