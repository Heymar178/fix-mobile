import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useSelectedStore } from '../../src/hooks/useSelectedStore';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

export default function TabLayout() {
  const { selectedStoreId, loading } = useSelectedStore();

  // Skip redirect for server-side rendering
  const isClient = typeof window !== 'undefined';

  useEffect(() => {
    // Only redirect when we're on the client and have confirmed there's no selected store
    if (isClient && !loading && selectedStoreId === null) {
      router.replace('/select-store');
    }
  }, [selectedStoreId, loading, isClient]);

  // Don't render tabs until we're sure a store is selected
  if (loading) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4a90e2',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <FontAwesome name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, size }) => <FontAwesome name="shopping-cart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ color }) => <FontAwesome name="list" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <FontAwesome name="search" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => <FontAwesome name="user" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
