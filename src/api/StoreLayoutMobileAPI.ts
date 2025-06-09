import { supabase } from '../lib/supabaseClient'; // Adjusted path for mobile
import {
  StoreInfo,
  StoreLayout,
  CategoryInfo,
  FeaturedTagInfo,
  ProductInfo,
  StoreLayoutData,
  LocationInfo,
  StoreSettings, // Added StoreSettings from shared types
} from '../types/storeLayoutSharedTypes'; // Adjusted path for mobile

const STORE_LAYOUT_SELECT = 'id, home_layout_draft, home_layout_published';

// Helper to handle Supabase errors
const handleSupabaseError = (error: any, context: string) => {
  if (error) {
    console.error(`Supabase error in ${context}:`, error);
    throw new Error(`Failed operation in ${context}: ${error.message}`);
  }
};

// Fetch basic info for all stores
export const getStores = async (): Promise<StoreInfo[]> => {
  const { data, error } = await supabase
    .from('stores')
    .select('id, name')
    .order('name');

  handleSupabaseError(error, 'getStores');
  return data || [];
};

// Fetch the full layout data (draft and published) for a specific store
export const getStoreLayoutData = async (storeId: string): Promise<StoreLayoutData | null> => {
  if (!storeId) return null;

  const { data, error } = await supabase
    .from('stores')
    .select(STORE_LAYOUT_SELECT)
    .eq('id', storeId)
    .single();

  handleSupabaseError(error, `getStoreLayoutData (storeId: ${storeId})`);

  if (!data) return null;

  // Ensure JSONB fields are parsed or default to empty array/null
  return {
    layout_draft: (data.home_layout_draft as StoreLayout | null) ?? [], // Default to empty array
    layout_published: (data.home_layout_published as StoreLayout | null) ?? null,
  };
};

// Update the draft layout for a store
export const updateStoreLayoutDraft = async (
  storeId: string,
  layoutDraft: StoreLayout
): Promise<StoreLayout> => {
  if (!storeId) throw new Error('Store ID is required to update layout draft.');

  const { data, error } = await supabase
    .from('stores')
    .update({ home_layout_draft: layoutDraft, updated_at: new Date().toISOString() })
    .eq('id', storeId)
    .select('home_layout_draft') // Select the updated draft to return
    .single();

  handleSupabaseError(error, `updateStoreLayoutDraft (storeId: ${storeId})`);

  if (!data?.home_layout_draft) {
     throw new Error('Failed to update or retrieve layout draft after update.');
  }

  return data.home_layout_draft as StoreLayout;
};

// Publish the current draft layout (copy draft to published)
export const publishStoreLayout = async (
  storeId: string,
  layoutToPublish: StoreLayout
): Promise<void> => {
  if (!storeId) throw new Error('Store ID is required to publish layout.');

  if (!layoutToPublish || layoutToPublish.length === 0) {
    throw new Error('Cannot publish an empty layout.');
  }

  const { error } = await supabase
    .from('stores')
    .update({
      home_layout_published: layoutToPublish,
      updated_at: new Date().toISOString(),
    })
    .eq('id', storeId);

  handleSupabaseError(error, `publishStoreLayout (storeId: ${storeId})`);
};

// --- Functions to fetch data for Content Selectors ---

// Fetch categories for a store
export const getCategories = async (storeId: string): Promise<CategoryInfo[]> => {
  if (!storeId) return [];
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, icon_url')
    .eq('store_id', storeId)
    .order('name');

  handleSupabaseError(error, `getCategories (storeId: ${storeId})`);
  return (data || []).map((c: { id: string; name: string; icon_url: string | null }) => ({ ...c, iconUrl: c.icon_url }));
};

// Fetch featured tags for a store
export const getFeaturedTags = async (storeId: string): Promise<FeaturedTagInfo[]> => {
  if (!storeId) return [];
  const { data, error } = await supabase
    .from('featured_tags')
    .select('id, name, icon_url, background_color, text_color')
    .eq('store_id', storeId)
    .order('name');

  handleSupabaseError(error, `getFeaturedTags (storeId: ${storeId})`);
  return (data || []).map((t: {
    id: string; 
    name: string; 
    icon_url: string | null; 
    background_color: string | null;
    text_color: string | null;
  }) => ({ 
    ...t, 
    iconUrl: t.icon_url,
    // background_color and text_color are already correctly named from DB for FeaturedTagInfo
  }));
};

// Fetch locations associated with a specific store chain
export const getLocationsForStore = async (storeId: string): Promise<LocationInfo[]> => {
  const { data, error } = await supabase
    .from('locations')
    .select('id, name, store_id')
    .eq('store_id', storeId);

  if (error) {
    console.error('Error fetching locations:', error);
    throw new Error(error.message);
  }
  return data || [];
};

export const searchProducts = async (
  storeId: string, 
  searchTerm: string | string[], 
  locationId?: string | null,
  deduplicateGlobally: boolean = true 
): Promise<ProductInfo[]> => {
    let query = supabase
      .from('products')
      .select('id, name, image_data, store_id, location_id, price, offer_price') 
      .eq('store_id', storeId);

    if (Array.isArray(searchTerm)) {
      if (searchTerm.length === 0) return [];
      query = query.in('id', searchTerm);
    } else if (typeof searchTerm === 'string' && searchTerm.trim() !== '') {
      const trimmedSearchTerm = searchTerm.trim();
      query = query.textSearch('name', `'${trimmedSearchTerm}'`, { type: 'plain', config: 'english' });
    } else {
      return [];
    }

    if (locationId) {
      query = query.eq('location_id', locationId);
    }
    query = query.limit(50);
    const { data, error } = await query;

    if (error) {
        console.error("Error searching products:", error);
        throw new Error(`Supabase error searching products: ${error.message} (code: ${error.code})`);
    }

    let processedData = data || [];
    if (!locationId && deduplicateGlobally && processedData.length > 0) {
        const uniqueProductNames = new Set<string>();
        processedData = processedData.filter(product => {
            const normalizedName = product.name.toLowerCase();
            if (uniqueProductNames.has(normalizedName)) return false;
            uniqueProductNames.add(normalizedName);
            return true;
        });
    }

    return (processedData).map((p: any) => {
      let imageUrl: string | undefined = undefined;
      if (p.image_data && Array.isArray(p.image_data) && p.image_data.length > 0) {
        const primaryImage = p.image_data.find((img: any) => img.is_primary);
        imageUrl = primaryImage ? primaryImage.url : p.image_data[0].url;
      }
      return {
        id: p.id,
        name: p.name,
        imageUrl: imageUrl,
        location_id: p.location_id,
        price: p.price,
        offerPrice: p.offer_price,
      } as ProductInfo; // Added type assertion
    });
};

export const getNewArrivals = async (
  storeId: string,
  locationId: string | null, // Allow null for locationId
  timeframeDays: number,
  limit: number
): Promise<ProductInfo[]> => {
  let query = supabase
    .from('products')
    .select('id, name, image_data, store_id, location_id, price, offer_price, created_at')
    .eq('store_id', storeId);

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - timeframeDays);
  query = query.gte('created_at', fromDate.toISOString());
  
  if (locationId) {
    query = query.eq('location_id', locationId);
  }
  
  query = query.order('created_at', { ascending: false }).limit(limit);

  const { data, error } = await query;
  handleSupabaseError(error, 'getNewArrivals');
  return (data || []).map((p: any) => {
    let imageUrl: string | undefined = undefined;
    if (p.image_data && Array.isArray(p.image_data) && p.image_data.length > 0) {
      const primaryImage = p.image_data.find((img: any) => img.is_primary);
      imageUrl = primaryImage ? primaryImage.url : p.image_data[0].url;
    }
    return {
      id: p.id,
      name: p.name,
      imageUrl: imageUrl,
      location_id: p.location_id,
      price: p.price,
      offerPrice: p.offer_price,
    } as ProductInfo;
  });
};

export const getTrendingProducts = async (
  storeId: string,
  locationId: string | null, // Allow null
  timeframeDays: number, // Currently unused, but kept for signature consistency
  limit: number
): Promise<ProductInfo[]> => {
  // Placeholder: Actual trending logic would require tracking product views/sales.
  // For now, let's return recent products as a stand-in.
  let query = supabase
    .from('products')
    .select('id, name, image_data, store_id, location_id, price, offer_price, created_at')
    .eq('store_id', storeId);

  if (locationId) {
    query = query.eq('location_id', locationId);
  }

  query = query.order('created_at', { ascending: false }) // Order by most recent as a proxy
               .limit(limit);

  const { data, error } = await query;
  handleSupabaseError(error, 'getTrendingProducts');
  return (data || []).map((p: any) => {
    let imageUrl: string | undefined = undefined;
    if (p.image_data && Array.isArray(p.image_data) && p.image_data.length > 0) {
      const primaryImage = p.image_data.find((img: any) => img.is_primary);
      imageUrl = primaryImage ? primaryImage.url : p.image_data[0].url;
    }
    return {
      id: p.id,
      name: p.name,
      imageUrl: imageUrl,
      location_id: p.location_id,
      price: p.price,
      offerPrice: p.offer_price,
    } as ProductInfo;
  });
};

export const getBestSellers = async (
  storeId: string,
  locationId: string | null, // Allow null
  limit: number
): Promise<ProductInfo[]> => {
  // Placeholder: Actual best-seller logic would require sales data.
  // For now, let's return a limited set of products, perhaps ordered by name or creation date as a stand-in.
  let query = supabase
    .from('products')
    .select('id, name, image_data, store_id, location_id, price, offer_price')
    .eq('store_id', storeId);

  if (locationId) {
    query = query.eq('location_id', locationId);
  }
  
  query = query.order('name', { ascending: true }) // Arbitrary order for now
               .limit(limit);

  const { data, error } = await query;
  handleSupabaseError(error, 'getBestSellers');
  return (data || []).map((p: any) => {
    let imageUrl: string | undefined = undefined;
    if (p.image_data && Array.isArray(p.image_data) && p.image_data.length > 0) {
      const primaryImage = p.image_data.find((img: any) => img.is_primary);
      imageUrl = primaryImage ? primaryImage.url : p.image_data[0].url;
    }
    return {
      id: p.id,
      name: p.name,
      imageUrl: imageUrl,
      location_id: p.location_id,
      price: p.price,
      offerPrice: p.offer_price,
    } as ProductInfo;
  });
};

export const getDiscountedProducts = async (
  storeId: string,
  locationId: string | null, // Allow null
  limit: number
): Promise<ProductInfo[]> => {
  let query = supabase
    .from('products')
    .select('id, name, image_data, store_id, location_id, price, offer_price')
    .eq('store_id', storeId)
    .not('offer_price', 'is', null); // Ensure offer_price exists
    // Optionally add: .lt('offer_price', ref('price')) if Supabase JS supports column referencing directly
    // Otherwise, filter client-side or use a DB function.

  if (locationId) {
    query = query.eq('location_id', locationId);
  }
  
  query = query.order('created_at', { ascending: false }) // Example order
               .limit(limit);

  const { data, error } = await query;
  handleSupabaseError(error, 'getDiscountedProducts');
  
  // Client-side filter for products where offer_price is actually less than price
  const effectivelyDiscounted = (data || []).filter(p => 
    typeof p.price === 'number' && 
    typeof p.offer_price === 'number' && 
    p.offer_price < p.price
  );

  return effectivelyDiscounted.map((p: any) => {
    let imageUrl: string | undefined = undefined;
    if (p.image_data && Array.isArray(p.image_data) && p.image_data.length > 0) {
      const primaryImage = p.image_data.find((img: any) => img.is_primary);
      imageUrl = primaryImage ? primaryImage.url : p.image_data[0].url;
    }
    return {
      id: p.id,
      name: p.name,
      imageUrl: imageUrl,
      location_id: p.location_id,
      price: p.price,
      offerPrice: p.offer_price,
    } as ProductInfo;
  });
};

export const getProductsByCategory = async (
  storeId: string,
  categoryId: string,
  locationId: string | null, 
  limit: number
): Promise<ProductInfo[]> => {
  let query = supabase
    .from('products')
    .select('id, name, image_data, store_id, location_id, price, offer_price, referenced_category_id')
    .eq('store_id', storeId)
    .eq('referenced_category_id', categoryId);

  if (locationId) {
    query = query.eq('location_id', locationId);
  }
  
  query = query.limit(limit);

  const { data, error } = await query;
  handleSupabaseError(error, 'getProductsByCategory');
  return (data || []).map((p: any) => {
    let imageUrl: string | undefined = undefined;
    if (p.image_data && Array.isArray(p.image_data) && p.image_data.length > 0) {
      const primaryImage = p.image_data.find((img: any) => img.is_primary);
      imageUrl = primaryImage ? primaryImage.url : p.image_data[0].url;
    }
    return {
      id: p.id,
      name: p.name,
      imageUrl: imageUrl,
      location_id: p.location_id,
      price: p.price,
      offerPrice: p.offer_price,
    } as ProductInfo;
  });
};

export const getProductsByTag = async (
  storeId: string,
  tagId: string, 
  locationId: string | null, 
  limit: number
): Promise<ProductInfo[]> => {
  let query = supabase
    .from('products')
    .select('id, name, image_data, store_id, location_id, price, offer_price, featured_tag_ids')
    .eq('store_id', storeId)
    .contains('featured_tag_ids', [tagId]);

  if (locationId) {
    query = query.eq('location_id', locationId);
  }
  
  query = query.limit(limit);

  const { data, error } = await query;
  handleSupabaseError(error, 'getProductsByTag');
  return (data || []).map((p: any) => {
    let imageUrl: string | undefined = undefined;
    if (p.image_data && Array.isArray(p.image_data) && p.image_data.length > 0) {
      const primaryImage = p.image_data.find((img: any) => img.is_primary);
      imageUrl = primaryImage ? primaryImage.url : p.image_data[0].url;
    }
    return {
      id: p.id,
      name: p.name,
      imageUrl: imageUrl,
      location_id: p.location_id,
      price: p.price,
      offerPrice: p.offer_price,
    } as ProductInfo;
  });
};

// Fetches store-specific settings (like theme, logo)
export const getStoreSettings = async (storeId: string): Promise<StoreSettings | null> => {
  if (!storeId) return null;
  const { data, error } = await supabase
    .from('store_settings')
    .select('store_id, logo_url, theme_store') 
    .eq('store_id', storeId)
    .maybeSingle(); // Use maybeSingle() if a store might not have settings yet

  // Do not throw an error if not found, as it might be optional
  if (error && error.code !== 'PGRST116') { // PGRST116: "Query returned no rows"
    console.error(`Supabase error in getStoreSettings (storeId: ${storeId}):`, error);
    throw new Error(`Failed operation in getStoreSettings: ${error.message}`);
  }
  return data as StoreSettings | null;
};

// Fetch global app settings (e.g., fallback theme)
export const getAppSettings = async (): Promise<any | null> => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('theme') // Assuming the theme JSON is in a 'theme' column
    .limit(1) // Get the first row
    .single(); // Expect a single row or null

  if (error && error.code !== 'PGRST116') { 
    console.error(`Supabase error in getAppSettings:`, error);
  }
  return data; // Returns the row { theme: { ... } } or null
}; 