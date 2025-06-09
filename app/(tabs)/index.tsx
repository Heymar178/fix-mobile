import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, 
  RefreshControl, SafeAreaView, TouchableOpacity, Image, TextInput
} from 'react-native';
import { useSelectedStore } from '../../src/hooks/useSelectedStore';
import { supabase } from '../../src/lib/supabaseClient';
import { LayoutSection } from '../../src/types/storeLayoutSharedTypes';
import BannerSection from '../../src/components/BannerSection';
import IconRowCategorySection from '../../src/components/IconRowCategorySection';
import FeaturedTagSection from '../../src/components/FeaturedTagSection';
import ProductCollectionSection from '../../src/components/ProductCollectionSection';
import { MapPin, Search } from 'lucide-react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { router } from 'expo-router';

// Local type alias
type StoreHomepageLayout = LayoutSection[];

export default function HomeScreen() {
  const { selectedStoreId } = useSelectedStore();
  const { colors, isThemeLoading, getTextColorForBackground, isDark, storeSettings } = useTheme();
  const [storeLayout, setStoreLayout] = useState<StoreHomepageLayout>([]);
  const [storeName, setStoreName] = useState<string>('');
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentBrandStoreId, setCurrentBrandStoreId] = useState<string | null>(null);

  const fetchStoreLayout = useCallback(async () => {
    console.log('[HomeScreen] fetchStoreLayout triggered. Selected Location ID:', selectedStoreId);
    setDataLoading(true);
    setError(null);
    setCurrentBrandStoreId(null);

    if (!selectedStoreId) {
      console.log('[HomeScreen] No selectedStoreId, setting defaults.');
      setStoreName('Choose a Location');
      setStoreLayout([]);
      setDataLoading(false);
      return;
    }
    
    try {
      console.log(`[HomeScreen] Fetching location details for ID: ${selectedStoreId}`);
      const { data: locationData, error: locationError } = await supabase
        .from('locations')
        .select('name, store_id')
        .eq('id', selectedStoreId)
        .single();

      if (locationError) throw locationError;
      if (!locationData) throw new Error('Selected location not found.');

      setStoreName(locationData.name || 'Location Home');
      const brandStoreId = locationData.store_id;
      setCurrentBrandStoreId(brandStoreId);
      console.log(`[HomeScreen] Location: ${locationData.name}, Brand Store ID: ${brandStoreId}`);

      if (brandStoreId) {
        console.log(`[HomeScreen] Fetching store layout for Brand Store ID: ${brandStoreId}`);
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('home_layout_published') 
          .eq('id', brandStoreId)
          .single();
        
        if (storeError) throw storeError;
        
        if (storeData && storeData.home_layout_published && Array.isArray(storeData.home_layout_published)) {
          const rawLayoutBeforeFilter = storeData.home_layout_published as LayoutSection[];
          const sortedLayout = rawLayoutBeforeFilter
            .filter(section => section.location_id === null || section.location_id === selectedStoreId)
            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
          
          setStoreLayout(sortedLayout);
          if (sortedLayout.length === 0) {
            console.warn('[HomeScreen] Warning: No layout sections after filtering.');
          }
        } else {
          setStoreLayout([]);
          console.log('[HomeScreen] home_layout_published missing or not an array.');
        }
      } else {
        setStoreLayout([]);
        console.log('[HomeScreen] No brandStoreId, clearing layout.');
      }
    } catch (e: any) {
      console.error('Error fetching store layout or settings:', e);
      setError(e.message || 'Failed to fetch data');
    } finally {
      setDataLoading(false);
      setRefreshing(false);
    }
  }, [selectedStoreId]);

  useEffect(() => {
    fetchStoreLayout();
  }, [fetchStoreLayout]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStoreLayout();
  }, [fetchStoreLayout]);

  const renderSection = (section: LayoutSection) => {
    switch (section.section_type) {
      case 'BANNER_MEDIA':
        return <BannerSection key={section.section_id} section={section} />;
      case 'BASE_CATEGORY':
        if (section.layout.style === 'ICON_ROW' || section.layout.style === 'CAROUSEL' || section.layout.style === 'GRID') {
          return <IconRowCategorySection key={section.section_id} section={section} />;
        }
        console.warn(`[HomeScreen] BASE_CATEGORY section "${section.title}" skipped due to unhandled layout style: ${section.layout.style}`);
        return null;
      case 'TAG_GROUP_NAV':
        if (section.layout.style === 'ICON_ROW' || section.layout.style === 'CAROUSEL' || section.layout.style === 'GRID') {
          return <FeaturedTagSection key={section.section_id} section={section} />;
        }
        console.warn(`[HomeScreen] TAG_GROUP_NAV section "${section.title}" skipped due to unhandled layout style: ${section.layout.style}`);
        return null;
      case 'PRODUCT_COLLECTION':
        if (!currentBrandStoreId) {
            console.warn(`[HomeScreen] Skipping PRODUCT_COLLECTION section ${section.section_id} because currentBrandStoreId is not set.`)
            return <View key={section.section_id}><Text>Product collection data unavailable.</Text></View>;
        }
        return <ProductCollectionSection key={section.section_id} section={section} appBrandId={currentBrandStoreId} />;
      default:
        console.log(`Unsupported section type: ${section.section_type} or layout style.`);
        return null;
    }
  };

  const searchBarActualBg = isDark(colors.primary) ? '#FFFFFF' : '#F0F0F0';
  const searchBarIconAndTextColor = getTextColorForBackground(searchBarActualBg);
  const searchBarPlaceholderTextColor = isDark(searchBarActualBg) ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.4)';

  const derivedStyles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.primary,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerContainer: {
      backgroundColor: colors.primary,
      paddingHorizontal: 15,
      paddingTop: 10,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark(colors.primary) ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.12)',
    },
    storeNameText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.headerText,
      marginBottom: 10,
      textAlign: 'center',
    },
    searchBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: searchBarActualBg,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    searchInput: {
      flex: 1,
      marginLeft: 8,
      fontSize: 16,
      color: searchBarIconAndTextColor,
    },
    logo: {
      height: 40,
      width: '100%',
      marginBottom: 10,
      alignSelf: 'center',
    },
    locationTouchable: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
      marginTop: 8,
    },
    locationText: {
      fontSize: 12,
      fontWeight: '500',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.background,
    },
    errorText: {
      fontSize: 16,
      color: getTextColorForBackground(colors.background),
      textAlign: 'center',
      marginBottom: 20,
    },
    retryButton: {
      backgroundColor: colors.accent,
      paddingVertical: 12,
      paddingHorizontal: 30,
      borderRadius: 8,
    },
    retryButtonText: {
      color: getTextColorForBackground(colors.accent),
      fontSize: 16,
      fontWeight: 'bold',
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.background,
    },
    emptyStateText: {
      fontSize: 18,
      color: getTextColorForBackground(colors.background),
      textAlign: 'center',
      marginBottom: 8,
    },
    emptyStateSubText: {
        fontSize: 14,
        color: getTextColorForBackground(colors.background),
        opacity: 0.7,
        textAlign: 'center',
    },
  });
  
  if (dataLoading || isThemeLoading) {
    return (
      <View style={derivedStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[derivedStyles.safeArea, { backgroundColor: colors.primary }]}>
        <View style={[derivedStyles.headerContainer, { backgroundColor: colors.primary, borderBottomColor: isDark(colors.primary) ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]}>
            <Text style={[derivedStyles.storeNameText, { color: colors.headerText }]}>Store</Text>
        </View>
        <View style={derivedStyles.errorContainer}>
          <Text style={derivedStyles.errorText}>{error}</Text>
          <TouchableOpacity style={derivedStyles.retryButton} onPress={fetchStoreLayout}>
            <Text style={derivedStyles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!selectedStoreId) {
    return (
      <SafeAreaView style={derivedStyles.safeArea}>
        <View style={derivedStyles.headerContainer}>
            <Text style={derivedStyles.storeNameText}>No Location Selected</Text>
        </View>
        <View style={derivedStyles.emptyStateContainer}>
          <MapPin size={48} color={getTextColorForBackground(colors.background)} style={{ opacity: 0.5, marginBottom: 16 }} />
          <Text style={derivedStyles.emptyStateText}>Please select a location.</Text>
          <Text style={derivedStyles.emptyStateSubText}>
            You can choose a location from the settings or profile screen.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={derivedStyles.safeArea}>
      <View style={derivedStyles.headerContainer}>
        {storeSettings?.logo_url ? (
          <Image 
            source={{ uri: storeSettings.logo_url }} 
            style={derivedStyles.logo} 
            resizeMode="contain" 
          />
        ) : (
          <Text style={derivedStyles.storeNameText}>{storeName}</Text>
        )}
        <View style={derivedStyles.searchBarContainer}>
          <Search size={20} color={searchBarIconAndTextColor} />
          <TextInput
            style={derivedStyles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={searchBarPlaceholderTextColor}
          />
        </View>
        {selectedStoreId && storeName && (
            <TouchableOpacity onPress={() => router.push('/select-store')} style={derivedStyles.locationTouchable}>
                <MapPin size={14} color={colors.headerText} style={{marginRight: 4}} />
                <Text style={[derivedStyles.locationText, { color: colors.headerText }]}>
                    Current Location: {storeName}
                </Text>
            </TouchableOpacity>
        )}
      </View>
      <ScrollView
        style={derivedStyles.container}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {storeLayout.length === 0 && !dataLoading && (
          <View style={derivedStyles.emptyStateContainer}>
             <Image 
              source={require('../../assets/images/react-logo.png')} // This path needs to be corrected
              style={styles.emptyStateImage}
            />
            <Text style={derivedStyles.emptyStateText}>Store Coming Soon!</Text>
            <Text style={derivedStyles.emptyStateSubText}>
              There are no sections configured for this store layout yet. Check back later!
            </Text>
          </View>
        )}
        {storeLayout.map(renderSection)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  emptyStateImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
    opacity: 0.6,
  },
});
