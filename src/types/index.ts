// Basic Store Information
export interface StoreInfo {
  id: string; // UUID
  name: string;
}

// Represents a single product (simplified for selection/display)
export interface ProductInfo {
  id: string; // UUID
  name: string;
  imageUrl?: string | null;
  price?: number; // Optional: for displaying price on product cards
  // Add other fields as needed by product card components
}

// Represents a category
export interface CategoryInfo {
  id: string; // UUID
  name: string;
  iconUrl?: string | null;
}

// Represents a featured tag
export interface FeaturedTagInfo {
  id: string; // UUID
  name: string;
  iconUrl?: string | null;
  background_color?: string | null;
  text_color?: string | null;
}

// Types for Content Source
export type ContentSourceType =
  | 'BASE_CATEGORY'
  | 'TAG_GROUP_NAV'
  | 'PRODUCT_COLLECTION';

export interface ContentSourceBase {
  type: ContentSourceType;
}

export interface ContentSourceCategory extends ContentSourceBase {
  type: 'BASE_CATEGORY';
  ids: string[]; // Array of category UUIDs
}

export interface ContentSourceTagGroupNav extends ContentSourceBase {
  type: 'TAG_GROUP_NAV';
  ids: string[]; // Array of tag UUIDs
}

export interface ContentSourceProductCollection extends ContentSourceBase {
  type: 'PRODUCT_COLLECTION';
  collection_mode: 'MANUAL_SELECTION' | 'BY_CRITERIA' | 'FROM_TAG' | 'FROM_CATEGORY';
  product_ids?: string[];
  ids?: string[]; // Legacy, prefer product_ids for manual
  criteria_type?: 'NEW_ARRIVALS' | 'TRENDING_NOW' | 'BEST_SELLERS' | 'DISCOUNTED';
  criteria_timeframe_days?: number;
  criteria_limit?: number;
  criteria_location_id?: string | null; // Important for location-specific bestsellers, etc.
  source_tag_id?: string;
  source_category_id?: string;
}

export type ContentSource =
  | ContentSourceCategory
  | ContentSourceTagGroupNav
  | ContentSourceProductCollection;

// Types for Layout Styles and Appearance
export type SectionLayoutStyle = 'GRID' | 'CAROUSEL' | 'ICON_ROW' | 'BANNER';
export type ItemCardShape = 'SQUARE' | 'ROUNDED' | 'CIRCLE';
export type ItemDimensions = string; // e.g., "100x100", "auto", "200x150"

export interface LayoutStyleConfig {
  style: SectionLayoutStyle;
  shape?: ItemCardShape;
  size?: string | null; // e.g., "60x60" for icons, "auto" for banners, "100%x200" for banners
  item_dimensions?: string | null; // Alternative to size, could be more specific like "w-full h-48"
  backgroundColor?: string | null; // Background for the section or items
  textColor?: string | null; // Default text color for items in the section
  item_card_background_color?: string | null; // Specific background for item cards
  item_text_color?: string | null; // Specific text color for item cards
  // Potentially more fields: textAlignment, etc.
}

// Type for Click Actions
export type ClickActionType =
  | 'LINK'
  | 'CATEGORY_PAGE'
  | 'PRODUCT_LIST'
  | 'TAG_PAGE'
  | 'PRODUCT_DETAIL'
  | 'SEARCH';

export interface ClickAction {
  type: ClickActionType;
  target: string; // e.g., URL, category ID, tag ID, product ID, search term
}

// Represents a single section in the layout
export interface LayoutSection {
  section_id: string; // UUID, unique identifier for this section instance
  title: string; // User-facing title (e.g., "Shop by Category")
  section_type: ContentSourceType | 'BANNER_MEDIA';
  source: ContentSource | null; // Source of content (null for BANNER_MEDIA)
  layout: LayoutStyleConfig;
  custom_image_url?: string | null;
  link_behavior?: ClickAction | null;
  display_order: number; // Order of the section on the page
}

// Represents the entire layout configuration for a store's homepage (from home_layout_published)
export type StoreHomepageLayout = LayoutSection[]; 

export interface StoreSettings {
  logo_url?: string | null;
  theme_store?: string | null; 
  // Potentially other settings like font, etc.
} 