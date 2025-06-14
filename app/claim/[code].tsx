import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, View } from 'react-native';
import { recipeEvents } from '../../utils/events';

export default function ClaimCodePage() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimData, setClaimData] = useState<any>(null);
  const { code } = params;

  useEffect(() => {
    if (code) {
      claimShareCode(code.toString());
    } else {
      setError('No share code provided');
      setLoading(false);
    }
  }, [code]);

  const claimShareCode = async (shareCode: string) => {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) {
        // If user is not logged in, redirect to login
        Alert.alert(
          'Login Required',
          'You need to be logged in to claim a recipe',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/auth')
            }
          ]
        );
        return;
      }

      const response = await fetch('https://serenidad.click/mealpack/claimShareCode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_token,
          share_code: shareCode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to claim recipe');
      }

      // Store the claim data for display
      setClaimData(data);
      setLoading(false);

      // Format the recipe data to match what detail.tsx expects
      const formattedRecipe = {
        ...data.recipe,
        imageData: data.recipe.image_url, // Add imageData field with the image URL
        image_url: data.recipe.image_url  // Ensure image_url is available for the list view
      };

      // Emit an event to add the recipe to the list
      recipeEvents.emit(formattedRecipe);

      // Show thank you message with sharer's info
      if (data.shared_by) {
        Alert.alert(
          'Recipe Added!',
          `Thanks to ${data.shared_by.name}, you now have ${data.recipe.name} in your Meal Pack. Enjoy!`,
          [
            {
              text: 'View Recipe',
              onPress: () => {
                // Navigate to the detail page
                router.replace({
                  pathname: '/detail',
                  params: {
                    recipe: JSON.stringify(formattedRecipe),
                    recipeId: data.recipe.id,
                    sharedBy: JSON.stringify(data.shared_by)
                  }
                });
              }
            }
          ]
        );
      } else {
        // Navigate directly to the detail page
        router.replace({
          pathname: '/detail',
          params: {
            recipe: JSON.stringify(formattedRecipe),
            recipeId: data.recipe.id
          }
        });
      }
    } catch (error: any) {
      setError(error.message || 'Failed to claim recipe');
      Alert.alert('Error', error.message || 'Failed to claim recipe');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Claiming recipe...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // This will only show briefly before the alert and navigation
  if (claimData && claimData.shared_by && claimData.recipe) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          {claimData.shared_by.profile_picture && (
            <Image 
              source={{ uri: claimData.shared_by.profile_picture }} 
              style={styles.profileImage}
            />
          )}
          <Text style={styles.successText}>
            Thanks to {claimData.shared_by.name}, you now have {claimData.recipe.name} in your Meal Pack. Enjoy!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text style={styles.loadingText}>Processing...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 18,
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
    padding: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 20,
  },
  successText: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
  }
}); 