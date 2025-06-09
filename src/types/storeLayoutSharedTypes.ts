// Basic Store Information
export interface StoreInfo {
  id: string; // UUID
  name: string;
}

// Basic Location Information (linked to a Store)
export interface LocationInfo {
    id: string; // UUID
    name: string;
    store_id: string; // Foreign key to StoreInfo
    // Add other relevant fields like address, city, etc. if needed for display
}

// Represents a single product (simplified for selection)
export interface ProductInfo {
  id: string; // UUID
  name: string;
  imageUrl?: string | null;
  location_id?: string; // Added for associating product with a specific location contextually
  featured_tag_ids?: string[]; // IDs of associated featured tags
  sku?: string; // Adding SKU for product identification
  price?: number; // Added for product price
  offerPrice?: number | null; // Added for product offer price (optional)
}

// Represents a category (simplified for selection)
export interface CategoryInfo {
  id: string; // UUID
  name: string;
  iconUrl?: string | null;
  background_color?: string | null; // Added for category-specific background color
  text_color?: string | null;       // Added for category-specific text color
}

// Represents a featured tag (simplified for selection)
export interface FeaturedTagInfo {
  id: string; // UUID
  name: string;
  iconUrl?: string | null;
  // shape?: ItemCardShape | null; // Removed
  // Background color is likely still useful for the tag chip itself
  background_color?: string | null; // Matches new DB column name
  text_color?: string | null;       // Matches new DB column name
}

// Types for Content Source
export type ContentSourceType =
  | 'BASE_CATEGORY'
  | 'TAG_GROUP_NAV'
  // | 'MANUAL_PRODUCT_SET' // Removed
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

export type ProductIdentifier = string; // Can be product ID or SKU

export interface ContentSourceProductCollection extends ContentSourceBase {
  type: 'PRODUCT_COLLECTION';
  collection_mode: 'MANUAL_SELECTION' | 'BY_CRITERIA' | 'FROM_TAG' | 'FROM_CATEGORY';
  product_ids?: ProductIdentifier[]; // For MANUAL_SELECTION (and legacy 'ids') - general fallback
  ids?: string[]; // Kept for compatibility, should consolidate to product_ids for manual
  manualSelectionsByLocation?: { [locationId: string]: ProductIdentifier[] }; // For location-specific manual selection
  criteria_type?: 'NEW_ARRIVALS' | 'TRENDING_NOW' | 'BEST_SELLERS' | 'DISCOUNTED'; // For BY_CRITERIA
  criteria_timeframe_days?: number; // For NEW_ARRIVALS, TRENDING_NOW
  criteria_limit?: number; // For all BY_CRITERIA modes and FROM_TAG, FROM_CATEGORY
  criteria_location_id?: string | null; // For location-specific criteria (currently unused in editor, handled by preview's selectedLocationId)
  source_tag_id?: string; // For FROM_TAG
  source_category_id?: string; // For FROM_CATEGORY
}

export type ContentSource =
  | ContentSourceCategory
  | ContentSourceTagGroupNav
  // | ContentSourceManualSet // Removed
  | ContentSourceProductCollection;

// Types for Layout Styles and Appearance
export type SectionLayoutStyle = 'GRID' | 'CAROUSEL' | 'ICON_ROW' | 'BANNER'; // Added BANNER explicitly
export type ItemCardShape = 'SQUARE' | 'ROUNDED' | 'CIRCLE';
export type ItemDimensions = string; // e.g., "100x100", "auto", "200x150"

export interface LayoutStyleConfig {
  style: SectionLayoutStyle;
  shape?: ItemCardShape | null; // Optional, relevant for icons/cards
  size?: ItemDimensions | null; // Optional, relevant for icons/cards/banners
  item_dimensions?: string; // Added for individual item dimensions
  backgroundColor?: string | null; // Added background color for the section items
  banner_width_mode?: 'full' | 'half'; // Added: Specific for banner width
  banner_height_mode?: 'small' | 'medium' | 'large'; // Added: Specific for banner height
  // Potentially add grid columns/rows config here if needed for GRID style
  // columns?: number;
}

// Type for Click Actions
export type ClickActionType =
  | 'LINK'
  | 'CATEGORY_PAGE'
  | 'PRODUCT_LIST'
  | 'TAG_PAGE'
  // | 'MANUAL_SET_PAGE' // Removed
  | 'PRODUCT_DETAIL' // Added for direct products
  | 'SEARCH';

export interface ClickAction {
  type: ClickActionType;
  target: string; // e.g., URL, category ID, tag ID, product ID, search term
}

// Represents a single section in the layout
export interface LayoutSection {
  section_id: string; // UUID, unique identifier for this section instance
  title: string; // User-facing title (e.g., "Shop by Category")
  section_type: ContentSourceType | 'BANNER_MEDIA'; // Use ContentSourceType or BANNER_MEDIA
  source: ContentSource | null; // Source of content (null for BANNER_MEDIA)
  layout: LayoutStyleConfig;
  custom_image_url?: string | null; // Optional custom image (e.g., for category icons)
  link_behavior?: ClickAction | null; // Optional click action
  custom_image_url_secondary?: string | null; // For second banner in half-width mode
  link_behavior_secondary?: ClickAction | null; // For second banner in half-width mode
  display_order: number; // Order of the section on the page
  location_id?: string | null; // Added for associating section with a specific location, or null for common
}

// Represents the entire layout configuration for a store
export type StoreLayout = LayoutSection[]; // An array of sections defining the layout

// Represents the data stored in Supabase 'stores' table JSONB columns
export interface StoreLayoutData {
  layout_draft: StoreLayout | null;
  layout_published: StoreLayout | null;
}

// Type for validation errors
export interface ValidationError {
  sectionId: string;
  field: string; // e.g., 'title', 'source.ids'
  message: string;
}

// Type for Store Settings (e.g., theme, logo)
export interface StoreSettings {
  store_id: string; // Foreign key to the stores table
  logo_url?: string | null;
  theme_store?: string | null; // Matches DB and mobile app type
  // Add other settings fields as needed, e.g., font_family, secondary_color, etc.
} 