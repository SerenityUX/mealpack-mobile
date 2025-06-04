import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getRecipes } from '../utils/getRecipes';
import { getToken, removeToken } from '../utils/token';

export default function ListView() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadToken();
    fetchRecipes();
  }, []);

  // Handle new recipe when it's passed as a parameter
  useEffect(() => {
    if (params.newRecipe) {
      try {
        const newRecipe = JSON.parse(params.newRecipe as string);
        setRecipes(prevRecipes => [newRecipe, ...prevRecipes]);
      } catch (error) {
        console.error('Error parsing new recipe:', error);
      }
    }
  }, [params.newRecipe]);

  const addNewRecipe = (recipe: any) => {
    setRecipes(prevRecipes => [recipe, ...prevRecipes]);
  };

  const loadToken = async () => {
    const storedToken = await getToken();
    setToken(storedToken);
  };

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const data = await getRecipes();
      setRecipes(data);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await removeToken();
    router.replace('/auth');
  };

  const handleRecipePress = (recipe: any) => {
    router.push({ pathname: '/detail', params: { recipe: JSON.stringify(recipe) } });
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, alignItems: 'center' }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          paddingHorizontal: 16,
          marginTop: 8,
          marginBottom: 8,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>List View</Text>
        <Pressable onPress={() => router.push('/create')}>
          <Text style={{ color: 'blue' }}>Create New Item</Text>
        </Pressable>
      </View>
      
      {token && (
        <View>
          <Text>Your Auth Token:</Text>
          <Text>{token}</Text>
        </View>
      )}

      <Pressable onPress={handleLogout}>
        <Text>Logout</Text>
      </Pressable>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <ScrollView style={{ width: '100%' }}>
          {recipes.map((recipe) => (
            <Pressable key={recipe.id} onPress={() => handleRecipePress(recipe)}>
              <Text style={{ fontSize: 18, padding: 10 }}>{recipe.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
} 