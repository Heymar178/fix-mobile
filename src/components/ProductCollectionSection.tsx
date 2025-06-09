import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
  ScrollView
} from 'react-native';
import { LayoutSection, ProductInfo, ContentSourceProductCollection, ClickAction, LayoutStyleConfig } from '../types/storeLayoutSharedTypes';
import { supabase } from '../lib/supabaseClient';
import { useSelectedStore } from '../hooks/useSelectedStore';
import { useTheme } from '../context/ThemeContext';
import { router } from 'expo-router';
import { Linking } from 'react-native';
import ProductCard from './ProductCard';

interface ProductCollectionSectionProps {
  section: LayoutSection;
  appBrandId: string;
}

const NUM_COLUMNS = 2;
const ITEM_MARGIN = 8;

const ProductCollectionSection: React.FC<ProductCollectionSectionProps> = ({ section, appBrandId }) => {
  const { colors, getTextColorForBackground, isDark } = useTheme();
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedStoreId: currentLocationId } = useSelectedStore();

  const sourceDetails = section.source as ContentSourceProductCollection | null;
  
  const collectionMode = sourceDetails?.collection_mode;
  const criteriaType = sourceDetails?.criteria_type;
  const criteriaLimit = sourceDetails?.criteria_limit;
  const criteriaTimeframe = sourceDetails?.criteria_timeframe_days;
  const manualProductIdsGlobalString = JSON.stringify(sourceDetails?.product_ids || []);
  const manualSelectionsByLocationString = JSON.stringify(sourceDetails?.manualSelectionsByLocation || {});
  const sourceCategoryId = sourceDetails?.source_category_id;
  const sourceTagId = sourceDetails?.source_tag_id;

  const sectionTitle = section.title;
  const showViewAll = sourceDetails && (
                        (sourceDetails.product_ids && sourceDetails.product_ids.length > 6) ||
                        (sourceDetails.criteria_limit && sourceDetails.criteria_limit > 6)
                      );
  const layoutConfig = section.layout as LayoutStyleConfig;

  const fetchProducts = useCallback(async () => {
    if (!sourceDetails || section.section_type !== 'PRODUCT_COLLECTION') {
      setLoading(false);
      setProducts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!appBrandId) {
        throw new Error("appBrandId prop is missing.");
      }

      if (!collectionMode) {
        console.warn('[ProductCollectionSection] collection_mode is undefined.');
        setProducts([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('products')
        .select('id, name, price, offer_price, image_data, store_id, location_id, created_at')
        .eq('store_id', appBrandId);

      const limit = criteriaLimit || 10;

      switch (collectionMode) {
        case 'MANUAL_SELECTION':
          let productIdsToFetch: string[] = [];
          const parsedSelectionsByLocation = JSON.parse(manualSelectionsByLocationString);
          const parsedGlobalProductIds = JSON.parse(manualProductIdsGlobalString);

          if (currentLocationId && parsedSelectionsByLocation?.[currentLocationId] && parsedSelectionsByLocation[currentLocationId].length > 0) {
            productIdsToFetch = parsedSelectionsByLocation[currentLocationId];
          } else if (parsedGlobalProductIds && parsedGlobalProductIds.length > 0) {
            productIdsToFetch = parsedGlobalProductIds;
          }

          if (productIdsToFetch.length === 0) {
            console.log('[ProductCollectionSection] No product IDs for MANUAL_SELECTION after checking location and global.');
            setProducts([]);
            setLoading(false);
            return; 
          }
          console.log(`[ProductCollectionSection] MANUAL_SELECTION - productIdsToFetch before Supabase query:`, JSON.stringify(productIdsToFetch));
          query = query.in('id', productIdsToFetch).limit(limit);
          break;

        case 'BY_CRITERIA':
          if (!currentLocationId) {
             console.warn('[ProductCollectionSection] No currentLocationId for BY_CRITERIA mode. Results may not be location-specific if not filtered by DB.');
          }

          if (criteriaType === undefined) {
            console.warn('[ProductCollectionSection] criteria_type is undefined for BY_CRITERIA mode.');
            setProducts([]);
            setLoading(false);
            return;
          }

          switch (criteriaType) {
            case 'NEW_ARRIVALS':
              const timeframe = criteriaTimeframe || 7;
              const fromDate = new Date();
              fromDate.setDate(fromDate.getDate() - timeframe);
              query = query.gte('created_at', fromDate.toISOString())
                           .order('created_at', { ascending: false });
              if (currentLocationId) query = query.eq('location_id', currentLocationId);
              query = query.limit(limit);
              break;
            case 'DISCOUNTED':
              query = query.not('offer_price', 'is', null)
                           .order('created_at', { ascending: false });
              if (currentLocationId) query = query.eq('location_id', currentLocationId);
              query = query.limit(limit);
              break;
            case 'BEST_SELLERS':
            case 'TRENDING_NOW':
              console.warn(`Unsupported BY_CRITERIA type: ${criteriaType}`);
              setProducts([]);
              setLoading(false);
              return;
            default:
              const exhaustiveCriteriaCheck: never = criteriaType;
              console.warn(`Unknown BY_CRITERIA type: ${exhaustiveCriteriaCheck}`);
              setProducts([]);
              setLoading(false);
              return;
          }
          break;

        case 'FROM_CATEGORY':
          if (!sourceCategoryId) {
            console.warn('No source_category_id for FROM_CATEGORY mode.');
            setProducts([]);
            setLoading(false);
            return;
          }
          query = query.eq('referenced_category_id', sourceCategoryId);
          if (currentLocationId) query = query.eq('location_id', currentLocationId);
          query = query.limit(limit);
          break;
        
        case 'FROM_TAG':
          if (!sourceTagId) {
            console.warn('No source_tag_id for FROM_TAG mode.');
            setProducts([]);
            setLoading(false);
            return;
          }
          query = query.contains('featured_tag_ids', [sourceTagId]);
          if (currentLocationId) query = query.eq('location_id', currentLocationId);
          query = query.limit(limit);
          break;

        default:
          const exhaustiveModeCheck: never = collectionMode; 
          console.warn(`Unsupported product collection_mode: ${exhaustiveModeCheck}`);
          setProducts([]);
          setLoading(false);
          return;
      }

      const { data, error: dbError } = await query;

      if (dbError) throw dbError;

      console.log(`[ProductCollectionSection] Supabase query data for section "${section.title}":`, data);

      const fetchedProducts = (data || []).map(p => {
        let imageUrl: string | undefined = undefined;
        if (p.image_data && Array.isArray(p.image_data) && p.image_data.length > 0) {
            const primaryImage = p.image_data.find((img: any) => img.is_primary);
            imageUrl = primaryImage ? primaryImage.url : p.image_data[0].url;
        } else if (typeof p.image_data === 'string') {
            imageUrl = p.image_data;
        }
        return {
          id: p.id,
          name: p.name,
          price: p.price,
          offerPrice: p.offer_price,
          imageUrl: imageUrl,
          location_id: p.location_id, 
        } as ProductInfo;
      });
      
      console.log(`[ProductCollectionSection] Mapped fetchedProducts for section "${section.title}" (IDs, Names, loc_id):`, fetchedProducts.map(p => ({id: p.id, name: p.name, loc: p.location_id })));

      if (collectionMode === 'MANUAL_SELECTION') {
        const locationFilteredProducts = fetchedProducts.filter(p =>
          p.location_id === currentLocationId || p.location_id === null || p.location_id === undefined
        );
        console.log(`[ProductCollectionSection] MANUAL_SELECTION after location filtering for location ${currentLocationId} (IDs, Names, loc_id):`, locationFilteredProducts.map(p => ({id: p.id, name: p.name, loc: p.location_id })));
        setProducts(locationFilteredProducts);
      } else if (collectionMode === 'BY_CRITERIA' && criteriaType === 'DISCOUNTED') {
        setProducts(fetchedProducts.filter(p => p.offerPrice && typeof p.price === 'number' && p.offerPrice < p.price));
      } else {
        setProducts(fetchedProducts);
      }

    } catch (e: any) {
      console.error('Error fetching products for ProductCollectionSection:', section.title, e);
      setError(e.message || 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [
    section.section_type, 
    section.title, 
    collectionMode, criteriaType, criteriaLimit, criteriaTimeframe, 
    manualProductIdsGlobalString, manualSelectionsByLocationString, 
    sourceCategoryId, sourceTagId,
    appBrandId, 
    currentLocationId 
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const cardBgColor = colors.secondary;

  const sectionTitleView = sectionTitle ? (
    <Text style={[styles.sectionTitle, { color: getTextColorForBackground(colors.background) }]}>
      {sectionTitle}
    </Text>
  ) : null;

  const viewAllButton = showViewAll && section.link_behavior ? (
    <TouchableOpacity onPress={() => {
      const linkBehavior = section.link_behavior as ClickAction;
      if (linkBehavior.type === 'LINK' && linkBehavior.target) {
        if (linkBehavior.target.startsWith('http')) {
          Linking.openURL(linkBehavior.target).catch(err => console.error("Couldn't load page", err));
        } else {
          router.push(linkBehavior.target as any);
        }
      } else if (linkBehavior.type === 'CATEGORY_PAGE' && linkBehavior.target) {
        router.push(`/category/${linkBehavior.target}` as any);
      } else if (linkBehavior.type === 'TAG_PAGE' && linkBehavior.target) {
        router.push(`/tag/${linkBehavior.target}` as any);
      } else if (linkBehavior.type === 'PRODUCT_LIST' && linkBehavior.target) {
        router.push(`/products?collection=${encodeURIComponent(linkBehavior.target)}` as any);
      }
    }}>
      <Text style={[styles.viewAllText, { color: colors.accent }]}>View All</Text>
    </TouchableOpacity>
  ) : null;

  const headerView = sectionTitleView || viewAllButton ? (
    <View style={styles.sectionHeaderContainer}>
      {sectionTitleView}
      {viewAllButton}
    </View>
  ) : null;

  const handleProductPress = (product: ProductInfo, actionConfig?: ClickAction | null) => {
    console.log('Product pressed:', product.name);
    if (actionConfig && actionConfig.target) {
      console.log('Action config for product:', actionConfig);
    } else {
        console.log(`Would navigate to product page for ID: ${product.id}`);
    }
  };

  if (loading) {
    return (
      <View style={[styles.sectionContainer, { backgroundColor: layoutConfig.backgroundColor || 'transparent'}]}>
        {headerView}
        <ActivityIndicator style={{ marginTop: 20 }} size="large" color={colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.sectionContainer, { backgroundColor: layoutConfig.backgroundColor || 'transparent'}]}>
        {headerView}
        <Text style={[styles.errorText, { color: getTextColorForBackground(colors.background) }]}>{error}</Text>
      </View>
    );
  }

  if (products.length === 0) {
    let noContentMsg = "No products in this collection.";
    if (collectionMode === 'BY_CRITERIA' && !currentLocationId) {
        noContentMsg = "No products found. This collection might require a specific location to be selected.";
    } else if (collectionMode === 'BY_CRITERIA') {
        noContentMsg = `No products found for criteria: ${criteriaType || 'N/A'}.`;
    } else if (collectionMode === 'MANUAL_SELECTION') {
        noContentMsg = "No products manually selected for this view.";
    }

    return (
        <View style={[styles.sectionContainer, { backgroundColor: layoutConfig.backgroundColor || 'transparent'}]}>
            {headerView}
            <Text style={[styles.noContentText, { color: getTextColorForBackground(colors.background) }]}>{noContentMsg}</Text>
        </View>
    );
  }

  const screenWidth = Dimensions.get('window').width;
  const productCardWidth = screenWidth * 0.35;
  const productCardHeight = productCardWidth * 1.7;

  return (
    <View style={[styles.sectionContainer, { backgroundColor: layoutConfig.backgroundColor || 'transparent'}]}>
      {headerView}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>
        {products.map((product) => (
          <View key={product.id} style={[styles.productCardWrapper, {width: productCardWidth, height: productCardHeight} ]}>
            <ProductCard
              product={{
                ...product,
                imageUrl: product.imageUrl || undefined,
              }}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    paddingVertical: 12,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollViewContent: {
    paddingHorizontal: 16, 
    paddingVertical: 5,
  },
  productCardWrapper: {
    marginRight: 12,
  },
  centeredContent: { height: 150, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 14, textAlign: 'center' },
  noContentText: { fontSize: 14, textAlign: 'center', fontStyle: 'italic' },
});

export default ProductCollectionSection; 