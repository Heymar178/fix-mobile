import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { LayoutSection, CategoryInfo, ClickAction, ContentSourceCategory, LayoutStyleConfig, ClickActionType } from '../types/storeLayoutSharedTypes';
import { supabase } from '../lib/supabaseClient';
import { useTheme } from '../context/ThemeContext';
import { router } from 'expo-router';
import { Linking } from 'react-native';
import { Store } from 'lucide-react-native';

interface IconRowCategorySectionProps {
  section: LayoutSection;
}

const parseIconSize = (sizeStr?: string | null): number => {
  if (!sizeStr) return 60;
  const parts = sizeStr.split('x');
  const firstPart = parseInt(parts[0], 10);
  return isNaN(firstPart) || firstPart <= 0 ? 60 : firstPart;
};

const handleCategoryPress = (category: CategoryInfo, actionConfig?: ClickAction | null) => {
  console.log('Category pressed:', category.name);
  if (actionConfig && actionConfig.target) {
    console.log('Action config for category:', actionConfig);
    // Future: Implement navigation based on actionConfig.type
    // e.g., router.push(`/categories/${actionConfig.target || category.id}`);
  } else {
    console.log(`Would navigate to category page for ID: ${category.id}`);
  }
};

const IconRowCategorySection: React.FC<IconRowCategorySectionProps> = ({ section }) => {
  const { colors, getTextColorForBackground, isDark } = useTheme();
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const iconSize = parseIconSize(section.layout.size || section.layout.item_dimensions);
  const isCircle = section.layout.shape === 'CIRCLE';
  const categoryIdsString = JSON.stringify((section.source as ContentSourceCategory)?.ids);

  const sectionTitle = section.title;
  const showViewAll = section.source?.ids && section.source.ids.length > 10;
  const layoutConfig = section.layout as LayoutStyleConfig;

  const fetchCategories = useCallback(async () => {
    const parsedCategoryIds = JSON.parse(categoryIdsString);
    console.log(`[IconRowCategorySection] Section: "${section.title}", Parsed Category IDs:`, parsedCategoryIds);

    if (!parsedCategoryIds || parsedCategoryIds.length === 0) {
      console.log(`[IconRowCategorySection] Section: "${section.title}", No category IDs to fetch.`);
      setLoading(false); 
      setCategories([]); 
      return;
    }
    setLoading(true);
    setError(null);
    try {
      console.log(`[IconRowCategorySection] Section: "${section.title}", Fetching categories with IDs:`, parsedCategoryIds);
      const { data, error: dbError } = await supabase
        .from('categories')
        .select('id, name, icon_url, background_color, text_color')
        .in('id', parsedCategoryIds);
      
      console.log(`[IconRowCategorySection] Section: "${section.title}", Supabase response data:`, data);
      if (dbError) {
        console.error(`[IconRowCategorySection] Section: "${section.title}", Supabase error:`, dbError);
        throw dbError;
      }
      
      const fetchedCategories = (data || []).map(c => ({ 
          id: c.id, 
          name: c.name, 
          iconUrl: c.icon_url,
          background_color: c.background_color,
          text_color: c.text_color,
        })) as CategoryInfo[];
      setCategories(fetchedCategories);
    } catch (e: any) {
      console.error('Error fetching categories for IconRow:', e);
      setError(e.message);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [categoryIdsString]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  if (section.section_type !== 'BASE_CATEGORY' || section.layout.style !== 'ICON_ROW') return null;

  const itemWrapperBgColor = colors.secondary;

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

  if (loading) {
    return (
      <View style={styles.sectionContainer}>
        {headerView}
        <View style={styles.centeredContent}><ActivityIndicator size="small" color={colors.accent} /></View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.sectionContainer}>
        {headerView}
        <View style={styles.centeredContent}>
            <Text style={[styles.errorText, { color: getTextColorForBackground(colors.background) }]}>
                {error}
            </Text>
        </View>
      </View>
    );
  }

  if (categories.length === 0) {
    const parsedCategoryIds = JSON.parse(categoryIdsString);
    if (parsedCategoryIds && parsedCategoryIds.length > 0) {
      return (
        <View style={styles.sectionContainer}>
          {headerView}
          <Text style={[styles.noContentText, { color: getTextColorForBackground(colors.background) }]}>
            No categories found for the given IDs.
          </Text>
        </View>
      );
    }
    return null; 
  }

  return (
    <View style={[styles.sectionContainer, { backgroundColor: layoutConfig.backgroundColor || 'transparent'}]}>
      {headerView}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>
        {categories.map((category) => {
          const itemBackgroundColor = category.background_color || layoutConfig.backgroundColor || colors.secondary;
          const categoryNameTextColor = category.text_color || getTextColorForBackground(itemBackgroundColor);
          const iconActualColor = category.text_color || getTextColorForBackground(itemBackgroundColor);

          let iconSize = 80;

          const cardShapeStyle = layoutConfig.shape === 'ROUNDED' ? { borderRadius: iconSize / 4 } :
                               layoutConfig.shape === 'CIRCLE' ? { borderRadius: iconSize / 2 } :
                               {};

          return (
            <TouchableOpacity 
              key={category.id}
              style={styles.categoryItemContainer}
              onPress={() => {
                router.push(`/category/${category.id}` as any);
              }}
            >
              <View style={[styles.iconWrapper, { width: iconSize, height: iconSize, backgroundColor: itemBackgroundColor }, cardShapeStyle]}>
                {category.iconUrl ? (
                  <Image source={{ uri: category.iconUrl }} style={[styles.icon, { width: iconSize * 0.6, height: iconSize * 0.6 }]} resizeMode="contain" />
                ) : (
                  <View style={[styles.iconPlaceholder, { width: iconSize * 0.6, height: iconSize * 0.6, backgroundColor: 'transparent'}]}>
                    <Store size={iconSize * 0.4} color={iconActualColor} />
                  </View>
                )}
              </View>
              <Text style={[styles.categoryName, { color: categoryNameTextColor }]} numberOfLines={2}>
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
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
  centeredContent: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 80, 
    paddingVertical: 10, 
  },
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  categoryItemContainer: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
    padding: 5,
  },
  icon: {
  },
  iconPlaceholder: {
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    textAlign: 'center',
  },
  noContentText: {
    fontSize: 12, 
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default IconRowCategorySection; 