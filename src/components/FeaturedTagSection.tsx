import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { LayoutSection, FeaturedTagInfo as WebFeaturedTagInfo, ClickAction, ContentSourceTagGroupNav, LayoutStyleConfig } from '../types/storeLayoutSharedTypes';
import { supabase } from '../lib/supabaseClient';
import { useTheme } from '../context/ThemeContext';
import { router } from 'expo-router';
import { Linking } from 'react-native';
import { TagIcon } from 'lucide-react-native';

interface FeaturedTagSectionProps {
  section: LayoutSection;
}

// Local type for tags, combining DB fields and potential display overrides from LayoutStyleConfig
interface FeaturedTagDisplayInfo extends WebFeaturedTagInfo {
  // These were for potential overrides, let's simplify based on the new WebFeaturedTagInfo
  // db_background_color?: string | null; // Already in WebFeaturedTagInfo as background_color
  // db_text_color?: string | null; // Already in WebFeaturedTagInfo as text_color

  // These will be the resolved colors for rendering
  final_itemBackgroundColor?: string | null;
  final_textColor?: string | null;
}

const parseIconSize = (sizeStr?: string | null): number => {
  if (!sizeStr) return 60;
  const parts = sizeStr.split('x');
  const firstPart = parseInt(parts[0], 10);
  return isNaN(firstPart) || firstPart <= 0 ? 60 : firstPart;
};

const handleTagPress = (tag: FeaturedTagDisplayInfo, actionConfig?: ClickAction | null) => {
  console.log('Tag pressed:', tag.name);
  if (actionConfig && actionConfig.target) {
    console.log('Action config for tag:', actionConfig);
    // Future: Implement navigation based on actionConfig.type
    // e.g. router.push(`/tags/${actionConfig.target || tag.id}`);
  } else {
    console.log(`Would navigate to tag page for ID: ${tag.id}`);
  }
};

const FeaturedTagSection: React.FC<FeaturedTagSectionProps> = ({ section }) => {
  const { colors, getTextColorForBackground, isDark } = useTheme();
  const [tags, setTags] = useState<FeaturedTagDisplayInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const iconSize = parseIconSize(section.layout.size || section.layout.item_dimensions);
  const isCircle = section.layout.shape === 'CIRCLE';

  const sourceTagGroup = section.source as ContentSourceTagGroupNav | null;
  const tagIdsString = JSON.stringify(sourceTagGroup?.type === 'TAG_GROUP_NAV' ? sourceTagGroup.ids : null);

  const fetchTags = useCallback(async () => {
    const parsedTagIds = JSON.parse(tagIdsString);
    if (!parsedTagIds || parsedTagIds.length === 0) {
      setLoading(false);
      setTags([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('featured_tags')
        .select('id, name, icon_url, background_color, text_color') // supabase still uses icon_url
        .in('id', parsedTagIds);

      if (dbError) throw dbError;
      
      const fetchedTags = (data || []).map(t => {
        // Resolve background color for the tag item:
        // 1. Tag's own background_color (from DB)
        // 2. Fallback to theme secondary color
        let resolvedItemBgColor = t.background_color || colors.secondary;
        
        // Resolve text color for the tag item:
        // 1. Tag's own text_color (from DB)
        // 2. Otherwise, calculate based on its actual background for contrast
        let resolvedItemTextColor = t.text_color || getTextColorForBackground(resolvedItemBgColor);
        
        return { 
          id: t.id,
          name: t.name,
          iconUrl: t.icon_url, // Map to iconUrl from DB's icon_url
          background_color: t.background_color, // Keep original DB value if needed elsewhere
          text_color: t.text_color, // Keep original DB value
          final_itemBackgroundColor: resolvedItemBgColor,
          final_textColor: resolvedItemTextColor,
        } as FeaturedTagDisplayInfo;
      });
      setTags(fetchedTags);
    } catch (e: any) {
      console.error('Error fetching tags for FeaturedTagSection:', e);
      setError(e.message);
      setTags([]);
    } finally {
      setLoading(false);
    }
  }, [tagIdsString, colors.secondary, getTextColorForBackground]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  if (section.section_type !== 'TAG_GROUP_NAV' || section.layout.style !== 'ICON_ROW') {
    return null;
  }

  const sectionTitle = section.title;
  const showViewAll = section.source?.ids && section.source.ids.length > 10;
  const layoutConfig = section.layout as LayoutStyleConfig;

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
      } else if (linkBehavior.type === 'TAG_PAGE' && linkBehavior.target) {
        router.push(`/tag/${linkBehavior.target}` as any);
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
        <View style={styles.centeredContent}>
          <ActivityIndicator size="small" color={colors.accent} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.sectionContainer}>
        {headerView}
        <View style={styles.centeredContent}>
          <Text style={[styles.errorText, { color: getTextColorForBackground(colors.background) }]}>{error}</Text>
        </View>
      </View>
    );
  }

  if (tags.length === 0) {
    const parsedTagIds = JSON.parse(tagIdsString);
      if (parsedTagIds && parsedTagIds.length > 0) {
      return (
        <View style={styles.sectionContainer}>
          {headerView}
          <Text style={[styles.noContentText, { color: getTextColorForBackground(colors.background) }]}>No tags found for the given IDs.</Text>
        </View>
      );
    }
    return null; 
  }

  return (
    <View style={[styles.sectionContainer, { backgroundColor: layoutConfig.backgroundColor || 'transparent'}]}>
      {headerView}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>
        {tags.map((tag) => {
          const itemBackgroundColor = tag.background_color || layoutConfig.backgroundColor || colors.secondary;
          const tagNameTextColor = tag.text_color || getTextColorForBackground(itemBackgroundColor);
          const iconActualColor = tag.text_color || getTextColorForBackground(itemBackgroundColor);
          let iconSize = 80;
          const cardShapeStyle = layoutConfig.shape === 'ROUNDED' ? { borderRadius: iconSize / 4 } :
                               layoutConfig.shape === 'CIRCLE' ? { borderRadius: iconSize / 2 } :
                               {};

          return (
            <TouchableOpacity 
              key={tag.id}
              style={styles.tagItemContainer}
              onPress={() => {
                router.push(`/tag/${tag.id}` as any); 
              }}
            >
              <View style={[styles.iconWrapper, { width: iconSize, height: iconSize, backgroundColor: itemBackgroundColor }, cardShapeStyle]}>
                {tag.iconUrl ? (
                  <Image source={{ uri: tag.iconUrl }} style={[styles.icon, { width: iconSize * 0.6, height: iconSize * 0.6 }]} resizeMode="contain" />
                ) : (
                  <View style={[styles.iconPlaceholder, { width: iconSize * 0.6, height: iconSize * 0.6, backgroundColor: 'transparent'}]}>
                    <TagIcon size={iconSize * 0.4} color={iconActualColor} />
                  </View>
                )}
              </View>
              <Text style={[styles.tagName, { color: tagNameTextColor }]} numberOfLines={2}>
                {tag.name}
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
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  tagItemContainer: {
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
  icon: {},
  iconPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  centeredContent: { height: 100, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 14, textAlign: 'center' },
  noContentText: { fontSize: 14, textAlign: 'center', fontStyle: 'italic' },
});

export default FeaturedTagSection; 