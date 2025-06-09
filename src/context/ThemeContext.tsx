import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useSelectedStore } from '../hooks/useSelectedStore';
import * as StoreLayoutAPI from '../api/StoreLayoutMobileAPI'; // Using the mobile-specific API
import { StoreSettings } from '../types/storeLayoutSharedTypes';
import { supabase } from '../lib/supabaseClient'; // Direct import

// Helper function (can be moved to utils if used elsewhere)
function isColorDark(hexColor?: string | null): boolean {
  if (!hexColor || typeof hexColor !== 'string') return false;
  let color = hexColor.charAt(0) === '#' ? hexColor.substring(1) : hexColor;
  if (color.length === 3) {
    color = color.split('').map(char => char + char).join('');
  }
  if (color.length !== 6) return false;

  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) return false;

  const luminance = (r * 299 + g * 587 + b * 114) / 1000;
  return luminance < 128;
}

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  headerText: string;
  // Add more derived colors as needed, e.g., cardBackground, cardText
}

interface ThemeContextType {
  colors: ThemeColors;
  isThemeLoading: boolean;
  getTextColorForBackground: (bg: string) => string;
  isDark: (bg: string) => boolean;
  storeSettings: StoreSettings | null;
}

const defaultColors: ThemeColors = {
  primary: '#FFFFFF', // Default header/primary background
  secondary: '#E0E0E0', // Default secondary
  accent: '#4a90e2',   // Default accent
  background: '#f0f2f5', // Default app background
  headerText: '#333333',
};

const ThemeContext = createContext<ThemeContextType>({
  colors: defaultColors,
  isThemeLoading: true,
  getTextColorForBackground: () => '#333333',
  isDark: () => false,
  storeSettings: null,
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { selectedStoreId } = useSelectedStore();
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [appSettings, setAppSettings] = useState<any | null>(null); // from app_settings table
  const [isThemeLoading, setIsThemeLoading] = useState(true);
  const [themeColors, setThemeColors] = useState<ThemeColors>(defaultColors);

  const fetchThemeSettings = useCallback(async () => {
    setIsThemeLoading(true);
    try {
      // Ensure supabase is available before proceeding if selectedStoreId exists
      // (though direct import should make it available immediately unless there's an init issue in supabaseClient.ts)
      if (selectedStoreId && !supabase) {
        console.warn("[ThemeContext] Supabase client not ready, deferring settings fetch.");
        // Optionally, retry or wait, but direct import should solve this.
        // For safety, we can return early if it were still possible for supabase to be null.
        // However, with a direct import, this check becomes mostly a safeguard against unforeseen issues.
        setIsThemeLoading(false); // Stop loading if we can't proceed
        return;
      }

      const globalSettings = await StoreLayoutAPI.getAppSettings();
      setAppSettings(globalSettings);

      if (selectedStoreId) {
        const { data: locationData } = await supabase
          .from('locations')
          .select('store_id')
          .eq('id', selectedStoreId)
          .single();
        
        if (locationData?.store_id) {
          const specificStoreSettings = await StoreLayoutAPI.getStoreSettings(locationData.store_id);
          setStoreSettings(specificStoreSettings);
        } else {
          setStoreSettings(null); // No associated store_id for the location
        }
      } else {
        setStoreSettings(null); // No location selected
      }
    } catch (error) {
      console.error("Error fetching theme settings:", error);
      setStoreSettings(null); // Ensure fallback on error
    } finally {
      // Delay setting loading to false slightly to allow theme processing
      // This might not be strictly necessary if deriveThemeColors is fast
      setTimeout(() => setIsThemeLoading(false), 50); 
    }
  }, [selectedStoreId]);

  useEffect(() => {
    fetchThemeSettings();
  }, [fetchThemeSettings]);
  
  // Helper function to get text color based on background
  const getTextColorForBackground = (bgHex: string): string => {
    return isColorDark(bgHex) ? '#FFFFFF' : '#333333';
  };


  useEffect(() => {
    let parsedTheme: any = null;

    // Prioritize storeSettings.theme_store
    if (storeSettings?.theme_store) {
        console.log('[ThemeContext] store_settings.theme_store found. Type:', typeof storeSettings.theme_store);
        if (typeof storeSettings.theme_store === 'object') { // Check for object first
            parsedTheme = storeSettings.theme_store;
            console.log('[ThemeContext] Used store_settings.theme_store (object directly)');
        } else if (typeof storeSettings.theme_store === 'string') {
            try {
                parsedTheme = JSON.parse(storeSettings.theme_store);
                console.log('[ThemeContext] Successfully parsed store_settings.theme_store (string)');
            } catch (e) {
                console.warn('[ThemeContext] Failed to parse store_settings.theme_store JSON string:', e);
                // Fallback logic if parsing store_settings string fails
                if (appSettings?.theme) { 
                    console.log('[ThemeContext] Falling back to app_settings.theme after store_settings.theme_store string parse fail. app_settings.theme type:', typeof appSettings.theme);
                    if (typeof appSettings.theme === 'object') {
                        parsedTheme = appSettings.theme;
                         console.log('[ThemeContext] Fallback to app_settings.theme (object) successful.');
                    } else if (typeof appSettings.theme === 'string') {
                        try {
                            parsedTheme = JSON.parse(appSettings.theme);
                            console.log('[ThemeContext] Fallback to app_settings.theme (parsed string) successful.');
                        } catch (e2) {
                            console.warn('[ThemeContext] Failed to parse app_settings.theme JSON string as fallback:', e2);
                        }
                    }
                } else {
                    console.log('[ThemeContext] No app_settings.theme to fallback to after store_settings.theme_store string parse fail.');
                }
            }
        } else {
            console.warn('[ThemeContext] store_settings.theme_store is neither an object nor a string. Type:', typeof storeSettings.theme_store);
        }
    } else {
        console.log('[ThemeContext] No store_settings.theme_store found.');
    }

    // If storeSettings.theme_store was not available or not usable, try appSettings.theme
    if (!parsedTheme && appSettings?.theme) {
        console.log('[ThemeContext] store_settings.theme_store was not used or resulted in no parsedTheme. Trying app_settings.theme. Type:', typeof appSettings.theme);
        if (typeof appSettings.theme === 'object') {
            parsedTheme = appSettings.theme;
            console.log('[ThemeContext] Used app_settings.theme (object) as primary source.');
        } else if (typeof appSettings.theme === 'string') {
            try {
                parsedTheme = JSON.parse(appSettings.theme);
                console.log('[ThemeContext] Used app_settings.theme (parsed string) as primary source.');
            } catch (e) {
                console.warn('[ThemeContext] Failed to parse app_settings.theme JSON string as primary source:', e);
            }
        } else {
             console.warn('[ThemeContext] app_settings.theme is neither an object nor a string. Type:', typeof appSettings.theme);
        }
    } else if (!parsedTheme) {
        console.log('[ThemeContext] No theme could be determined from store_settings or app_settings.');
    }


    const newColors = { ...defaultColors };
    if (parsedTheme) {
      if (parsedTheme.primary && typeof parsedTheme.primary === 'string' && parsedTheme.primary.trim() !== '') {
        newColors.primary = parsedTheme.primary;
      } else if (parsedTheme.background && typeof parsedTheme.background === 'string' && parsedTheme.background.trim() !== '') {
        // Fallback for header if primary is not set but background is
        newColors.primary = parsedTheme.background;
      }
      
      if (parsedTheme.secondary && typeof parsedTheme.secondary === 'string' && parsedTheme.secondary.trim() !== '') {
        newColors.secondary = parsedTheme.secondary;
      }
      if (parsedTheme.accent && typeof parsedTheme.accent === 'string' && parsedTheme.accent.trim() !== '') {
        newColors.accent = parsedTheme.accent;
      }
      if (parsedTheme.background && typeof parsedTheme.background === 'string' && parsedTheme.background.trim() !== '') {
        newColors.background = parsedTheme.background;
      }
    }
    
    newColors.headerText = getTextColorForBackground(newColors.primary);
    setThemeColors(newColors);

    console.log('storeSettings:', storeSettings);
    console.log('appSettings:', appSettings);
    console.log('parsedTheme:', parsedTheme);
    console.log('newColors:', newColors);

  }, [storeSettings, appSettings]);

  return (
    <ThemeContext.Provider value={{ colors: themeColors, isThemeLoading, getTextColorForBackground, isDark: isColorDark, storeSettings }}>
      {children}
    </ThemeContext.Provider>
  );
}; 