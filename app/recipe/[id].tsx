import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';

export default function RecipeDeepLink() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        // Get auth token
        const auth_token = await AsyncStorage.getItem('auth_token');
        if (!auth_token) {
          // If not logged in, redirect to login
          Alert.alert(
            'Login Required',
            'You need to log in to view this recipe',
            [
              { text: 'OK', onPress: () => router.replace('/login') }
            ]
          );
          return;
        }

        // Fetch the recipe by ID
        const response = await fetch(`https://serenidad.click/mealpack/getRecipe?id=${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth_token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch recipe');
        }

        const data = await response.json();
        
        // Navigate to detail view with the recipe data
        router.replace({
          pathname: '/detail',
          params: {
            recipe: JSON.stringify(data)
          }
        });
      } catch (error) {
        console.error('Error fetching recipe:', error);
        Alert.alert(
          'Error',
          'Failed to load the recipe. Please try again.',
          [
            { text: 'OK', onPress: () => router.replace('/') }
          ]
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRecipe();
    } else {
      Alert.alert(
        'Error',
        'Invalid recipe link',
        [
          { text: 'OK', onPress: () => router.replace('/') }
        ]
      );
    }
  }, [id, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {loading ? (
        <>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: 16, fontSize: 16 }}>Loading recipe...</Text>
        </>
      ) : null}
    </View>
  );
} 