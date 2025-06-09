import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking, Dimensions, ViewStyle, DimensionValue } from 'react-native';
import { LayoutSection, ClickAction, LayoutStyleConfig } from '../types/storeLayoutSharedTypes';
import { useTheme } from '../context/ThemeContext';
import { router } from 'expo-router';
import { ImageOff } from 'lucide-react-native';

interface BannerSectionProps {
  section: LayoutSection;
}

// Helper component for individual banner rendering
interface BannerItemProps {
  imageUrl?: string | null;
  linkBehavior?: ClickAction | null;
  width: DimensionValue;
  height: DimensionValue;
  colors: any; // from useTheme()
  getTextColorForBackground: (bg: string) => string;
}

const BannerItem: React.FC<BannerItemProps> = ({ imageUrl, linkBehavior, width, height, colors, getTextColorForBackground }) => {
  const handlePress = () => {
    if (linkBehavior) {
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
      } else if (linkBehavior.type === 'PRODUCT_DETAIL' && linkBehavior.target) {
        router.push(`/product/${linkBehavior.target}` as any);
      }
    }
  };

  if (!imageUrl) {
    return (
      <View style={[styles.bannerContainer, {width, height, backgroundColor: colors.secondary}, styles.centeredContent]}>
        <ImageOff size={48} color={getTextColorForBackground(colors.secondary)} />
        <Text style={{color: getTextColorForBackground(colors.secondary), marginTop: 8}}>Banner Image Missing</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.bannerContainer, { width, height }]} 
      onPress={handlePress}
      activeOpacity={linkBehavior ? 0.7 : 1}
    >
      <Image 
        source={{ uri: imageUrl }}
        style={styles.bannerImage}
        resizeMode="cover" 
      />
    </TouchableOpacity>
  );
};

const parseDimensions = (size?: string | null): { width: DimensionValue; height?: DimensionValue } => {
  let parsedWidth: DimensionValue = '100%';
  let parsedHeight: DimensionValue | undefined = 200; // Default height

  if (!size) return { width: parsedWidth, height: parsedHeight };
  if (size === 'auto') return { width: '100%', height: undefined }; // Height will be auto based on image aspect ratio

  const parts = size.toLowerCase().split('x');

  if (parts.length === 2) {
    // Width part
    if (parts[0] === 'auto') {
      parsedWidth = '100%';
    } else if (parts[0].endsWith('%')) {
      parsedWidth = parts[0] as DimensionValue;
    } else {
      const numWidth = parseInt(parts[0], 10);
      parsedWidth = isNaN(numWidth) ? '100%' : numWidth;
    }
    // Height part
    if (parts[1] === 'auto') {
      parsedHeight = undefined;
    } else if (parts[1].endsWith('%')) {
      // Percentage height should ideally be based on parent container if possible
      // For now, let's assume it could be a percentage of screen height if not constrained by parent
      const screenHeight = Dimensions.get('window').height;
      const percentage = parseInt(parts[1].replace('%', ''), 10) / 100;
      parsedHeight = isNaN(percentage) ? 200 : screenHeight * percentage;
    } else {
      const numHeight = parseInt(parts[1], 10);
      parsedHeight = isNaN(numHeight) ? 200 : numHeight;
    }
  } else if (parts.length === 1 && parts[0] !== 'auto') {
      // If only one part, assume it's height, width is 100%
    if (parts[0].endsWith('%')) {
      const screenHeight = Dimensions.get('window').height;
      const percentage = parseInt(parts[0].replace('%', ''), 10) / 100;
      parsedHeight = isNaN(percentage) ? 200 : screenHeight * percentage;
    } else {
      const val = parseInt(parts[0], 10);
      if (!isNaN(val)) {
        parsedHeight = val;
      }
    }
  }
  return { width: parsedWidth, height: parsedHeight };
};

const handleLinkPress = (action: ClickAction | null | undefined) => {
  if (!action || !action.target) return;
  if (action.type === 'LINK') {
    Linking.openURL(action.target).catch(err => console.error('Failed to open URL:', err));
  } else {
    console.log(`Action type ${action.type} with target ${action.target} not yet implemented for navigation.`);
    // Placeholder for future navigation logic (e.g., using expo-router)
    // router.push(action.target);
  }
};

const BannerSection: React.FC<BannerSectionProps> = ({ section }) => {
  const { colors, getTextColorForBackground, isDark } = useTheme();
  const layoutConfig = section.layout as LayoutStyleConfig;

  let bannerHeightStyle: ViewStyle['height'] = 150; // Default medium
  if (layoutConfig.banner_height_mode === 'small') {
    bannerHeightStyle = 100;
  } else if (layoutConfig.banner_height_mode === 'large') {
    bannerHeightStyle = 250;
  }

  if (layoutConfig.banner_width_mode === 'half') {
    const halfWidth = '48.5%'; // Adjusted for a small gap
    return (
      <View style={styles.halfWidthContainer}>
        <BannerItem 
          imageUrl={section.custom_image_url}
          linkBehavior={section.link_behavior}
          width={halfWidth}
          height={bannerHeightStyle}
          colors={colors}
          getTextColorForBackground={getTextColorForBackground}
        />
        {section.custom_image_url_secondary && (
          <BannerItem 
            imageUrl={section.custom_image_url_secondary}
            linkBehavior={section.link_behavior_secondary}
            width={halfWidth}
            height={bannerHeightStyle}
            colors={colors}
            getTextColorForBackground={getTextColorForBackground}
          />
        )}
      </View>
    );
  }

  // Full width banner
  return (
    <BannerItem 
      imageUrl={section.custom_image_url}
      linkBehavior={section.link_behavior}
      width='100%' // Full width
      height={bannerHeightStyle}
      colors={colors}
      getTextColorForBackground={getTextColorForBackground}
    />
  );
};

const styles = StyleSheet.create({
  halfWidthContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  bannerContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  centeredContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Styles from MobilePreviewPanel section title (approximated)
  sectionTitleText: {
    fontSize: 10, // text-xs
    fontWeight: '600', // font-semibold
    marginBottom: 4, // mb-1
    paddingHorizontal: 4, // px-1
    textTransform: 'uppercase',
    letterSpacing: 0.5, // tracking-wide (approximate)
  },
  image: {
    width: '100%',
    height: '100%', // Stretches if parent has fixed height
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#cccccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Title overlay *on* the image - if needed in future, not section.title from preview
  // titleOverlay: {
  //   position: 'absolute',
  //   bottom: 0,
  //   left: 0,
  //   right: 0,
  //   backgroundColor: 'rgba(0,0,0,0.4)',
  //   paddingVertical: 8,
  //   paddingHorizontal: 12,
  // },
  // titleText: {
  //   color: '#FFFFFF',
  //   fontSize: 18,
  //   fontWeight: 'bold',
  //   textAlign: 'center',
  // },
});

export default BannerSection; 