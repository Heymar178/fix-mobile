// import { StoreInfo } from "./StoreInfo";
// import { LocationInfo } from "./LocationInfo";
// import { ProductInfo } from "./ProductInfo";

// Add types for your mobile application here

export interface StoreInfo {
  id: string;
  name: string;
}

export interface LocationInfo {
  id: string;
  name: string;
  street_address: string;
  store_id?: string;
  is_active?: boolean;
}

export interface ProductInfo {
  id: string;
  name: string;
  price?: number;
  offerPrice?: number | null;
  imageUrl?: string;
  store_id?: string; 
  category_id?: string;
  created_at?: string;
}

// export interface StoreInfo {
//   id: string;
//   name: string;
// }

// export interface LocationInfo {
//   id: string;
//   name: string;
//   address?: string; 
//   store_id?: string;
//   is_active?: boolean;
//   // Add other relevant fields from your 'locations' table that might be used in the app
// }

// // Example for product data if you fetch products directly in mobile app
// export interface Product {
//   id: string;
//   name: string;
//   price?: number;
//   offerPrice?: number | null;
//   imageUrl?: string;
//   // ... other product fields
// }

// Types needed by BannerSection, FeaturedTagSection, IconRowCategorySection

export type SectionType = 
  | 'BANNER_MEDIA' 
  | 'PRODUCT_COLLECTION' 
  | 'TAG_GROUP_NAV' 
  | 'BASE_CATEGORY' 
  | 'HTML_CONTENT'; // Add other section types as needed

export interface LayoutStyleConfig {
  style?: string; // e.g., 'BANNER', 'CAROUSEL', 'GRID', 'ICON_ROW'
  size?: string | null; // e.g., 'auto', '100%x200', '60x60'
  item_dimensions?: string | null; // For items within a section
  shape?: 'SQUARE' | 'CIRCLE' | 'ROUNDED' | null;
  backgroundColor?: string | null;
  textColor?: string | null;
  item_card_background_color?: string | null;
  item_text_color?: string | null;
  // ... any other layout-specific style properties
}

export interface ClickAction {
  type: 'LINK' | 'NAVIGATE_TO_PRODUCT' | 'NAVIGATE_TO_CATEGORY' | 'NAVIGATE_TO_TAG' | 'NONE';
  target?: string | null; // URL or ID
}

export interface ContentSourceProductCollection {
  type: 'PRODUCT_COLLECTION';
  collection_mode: 'MANUAL_SELECTION' | 'BY_CRITERIA' | 'FROM_TAG' | 'FROM_CATEGORY';
  product_ids?: string[];
  manualSelectionsByLocation?: { [locationId: string]: string[] };
  criteria_type?: 'NEW_ARRIVALS' | 'TRENDING_NOW' | 'BEST_SELLERS' | 'DISCOUNTED' | null;
  criteria_timeframe_days?: number | null;
  criteria_limit?: number | null;
  source_tag_id?: string | null;
  source_category_id?: string | null;
  ids?: string[];
}

export interface ContentSourceTagGroupNav {
  type: 'TAG_GROUP_NAV';
  ids?: string[] | null; // Featured Tag IDs
}

export interface ContentSourceCategory {
  type: 'BASE_CATEGORY';
  ids?: string[] | null; // Category IDs
}

export interface LayoutSection {
  section_id: string;
  store_id: string;
  location_id: string | null; // Can be null for all-locations
  title?: string | null;
  section_type: SectionType;
  display_order: number;
  is_active: boolean;
  layout: LayoutStyleConfig;
  source: ContentSourceProductCollection | ContentSourceTagGroupNav | ContentSourceCategory | { type: 'BANNER_MEDIA' | 'HTML_CONTENT', [key: string]: any } | null;
  custom_image_url?: string | null;
  html_content?: string | null;
  link_behavior?: ClickAction | null;
  created_at?: string;
  updated_at?: string;
}

export interface FeaturedTagInfo {
  id: string;
  name: string;
  icon_url?: string | null;
  background_color?: string | null;
  text_color?: string | null;
  // Add other fields from your 'featured_tags' table if needed
}

export interface CategoryInfo {
  id: string;
  name: string;
  icon_url?: string | null; // Assuming categories can have icons
  // Add other fields from your 'categories' table if needed
}

// Definition for StoreHomepageLayout
export type StoreHomepageLayout = LayoutSection[];

// You can expand this file with more types as your mobile app grows.
// export { StoreInfo, LocationInfo, ProductInfo }; 