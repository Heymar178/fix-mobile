import { useTheme } from '../../context/ThemeContext'; // Adjusted path - assuming this is correct
import { CategoryInfo, LayoutSection } from '../../../../src/features/store-layout/types'; // Adjusted path to main types
import { useRouter } from 'expo-router';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native'; // Added imports
import React from 'react'; // Added React import

// Placeholder for CategoryItemProps - adjust as needed
interface CategoryItemProps {
  item: CategoryInfo;
  layoutStyle: LayoutSection['layout']['style'];
  itemDimensionStyle: any; // Replace 'any' with a proper style type if available
  itemShape: LayoutSection['layout']['shape'];
}

const CategoryItem: React.FC<CategoryItemProps> = ({ item, layoutStyle, itemDimensionStyle, itemShape }) => {
  const { colors, getTextColorForBackground, isDark } = useTheme();
  const router = useRouter();

  // Determine background and text colors
  const categoryBgColor = item.background_color || colors.secondary;
  // If item.text_color is provided, use it. Otherwise, derive from categoryBgColor.
  const categoryTextColor = item.text_color || getTextColorForBackground(categoryBgColor);

  const cardStyle = [
    styles.itemContainer,
    itemDimensionStyle,
    layoutStyle === 'ICON_ROW' ? styles.iconRowItem : styles.gridItem,
    itemShape === 'CIRCLE' && styles.circle,
    itemShape === 'ROUNDED' && styles.rounded,
    { backgroundColor: categoryBgColor },
  ];

  const textStyle = [
    styles.itemText,
    layoutStyle === 'ICON_ROW' ? styles.iconRowText : styles.gridText,
    { color: categoryTextColor },
  ];

  // Example minimal JSX structure
  return (
    <TouchableOpacity onPress={() => console.log('Item pressed:', item.id)} style={cardStyle}>
      {/* Add Image component if item.iconUrl exists */}
      {/* <Image source={{ uri: item.iconUrl }} style={styles.itemImage} /> */}
      <Text style={textStyle}>{item.name}</Text>
    </TouchableOpacity>
  );
};

// Define IconRowCategorySection if it's a component
const IconRowCategorySection = ({ section }: { section: LayoutSection }) => {
    // This is a very basic placeholder. You'll need to adapt it to render CategoryItem components here
    // based on the section.source (e.g., section.source.ids and fetching actual categories)
    // and section.layout.
    return (
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {/* Map through your items and render CategoryItem components here */}
            {/* Example: <CategoryItem item={...} layoutStyle={...} ... /> */}
        </View>
    );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: 4, // Align with item margins
  },
  itemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    margin: 4, 
  },
  iconRowItem: {
  },
  gridItem: {
  },
  circle: {
    borderRadius: 1000, 
  },
  rounded: {
    borderRadius: 12, 
  },
  itemImage: {
     width: 50, // Example fixed size, adjust as needed
     height: 50,
     resizeMode: 'contain',
     marginBottom: 4,
  },
  itemText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4, 
  },
  iconRowText: {
    fontSize: 11,
  },
  gridText: {
    fontSize: 13,
  },
});

export default IconRowCategorySection; 