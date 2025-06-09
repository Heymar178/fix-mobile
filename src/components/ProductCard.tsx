import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { ProductInfo } from '../types/storeLayoutSharedTypes'; // Assuming ProductInfo is defined here
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

interface ProductCardProps {
  product: ProductInfo;
  cardWidth?: number; // Optional prop to control width externally
}

const ProductCard: React.FC<ProductCardProps> = ({ product, cardWidth }) => {
  const { colors, getTextColorForBackground } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  // Adjust card width: Use prop if provided, else ~38% of screen width, with a min and max
  const finalCardWidth = cardWidth ? cardWidth : Math.max(140, Math.min(screenWidth * 0.38, 180));
  const imageHeight = finalCardWidth * 1.1; // Maintain an aspect ratio for the image

  const handleProductPress = () => {
    router.push(`/product/${product.id}` as any);
  };

  const displayPrice = product.offerPrice && product.offerPrice < (product.price ?? Infinity)
    ? product.offerPrice
    : product.price;
  const originalPrice = product.offerPrice && product.offerPrice < (product.price ?? Infinity)
    ? product.price
    : null;

  const cardBackgroundColor = colors.secondary; // Or another appropriate theme color
  const textColor = getTextColorForBackground(cardBackgroundColor);
  const priceColor = colors.accent; // Or another distinct color for price

  return (
    <TouchableOpacity onPress={handleProductPress} style={[styles.cardContainer, { width: finalCardWidth, backgroundColor: cardBackgroundColor }]}>
      <View style={[styles.imageContainer, { height: imageHeight }]}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={{ color: textColor }}>No Image</Text>
          </View>
        )}
      </View>
      <View style={styles.infoContainer}>
        <Text style={[styles.name, { color: textColor }]} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.priceContainer}>
          {displayPrice !== undefined && displayPrice !== null && (
            <Text style={[styles.price, { color: priceColor }]}>
              ${displayPrice.toFixed(2)}
            </Text>
          )}
          {originalPrice && (
            <Text style={[styles.originalPrice, { color: textColor + 'aa' }]}> 
              ${originalPrice.toFixed(2)}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    margin: 8, // Added margin for padding between cards
  },
  imageContainer: {
    width: '100%',
    backgroundColor: '#e0e0e0', // Placeholder while image loads or if no image
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    padding: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  originalPrice: {
    fontSize: 12,
    marginLeft: 6,
    textDecorationLine: 'line-through',
  },
});

export default ProductCard; 