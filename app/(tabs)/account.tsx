import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useSelectedStore } from '../../src/hooks/useSelectedStore';
import { router } from 'expo-router';

export default function AccountScreen() {
  const { selectedStoreId, clearSelectedStore } = useSelectedStore();

  const handleChangeStore = async () => {
    await clearSelectedStore();
    // router.replace('/select-store');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Account</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.message}>Account functionality coming soon!</Text>
        
        <View style={styles.storeSection}>
          <Text style={styles.sectionTitle}>Store Settings</Text>
          <Text style={styles.storeInfo}>Current Store ID: {selectedStoreId}</Text>
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleChangeStore}
          >
            <Text style={styles.buttonText}>Change Store</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  storeSection: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  storeInfo: {
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#4a90e2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
}); 