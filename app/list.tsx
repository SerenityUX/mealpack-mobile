import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, FlatList, Image, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { recipeEvents, userProfileEvents } from '../utils/events';
import { getRecipes } from '../utils/getRecipes';
import { getToken, removeToken } from '../utils/token';

const RecipeGridItem = ({ item, onPress, itemWidth, padding }: { item: any, onPress: () => void, itemWidth: number, padding: number }) => {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  const onImageLoad = () => {
    // Trigger a subtle haptic at the start
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 80,
    }).start(() => {
      // Trigger a lighter haptic at the peak of the animation
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    });
  };

  return (
    <Pressable 
      onPress={onPress}
      style={{
        width: itemWidth,
        margin: padding / 2,
      }}
    >
      <Animated.View style={{
        aspectRatio: 3/4,
        borderRadius: 8,
        overflow: 'hidden',
        transform: [{ scale: scaleAnim }],
        borderWidth: 1,
        borderColor: '#000',
      }}>
        <Image
          source={{ uri: item.image_url }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          onLoad={onImageLoad}
        />
      </Animated.View>
    </Pressable>
  );
};

export default function ListView() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const numColumns = 3;
  const padding = 16;
  const itemWidth = (screenWidth - (padding * (numColumns + 1))) / numColumns;

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    viewableItems.forEach(({ item }) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    });
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  useEffect(() => {
    loadToken();
    fetchRecipes();
    
    // Subscribe to recipe deletion and edit events
    const unsubscribe = recipeEvents.subscribe((event: any) => {
      if (typeof event === 'string') {
        // Delete
        setRecipes(prevRecipes => prevRecipes.filter(r => r.id !== event));
      } else if (event && typeof event === 'object' && event.id) {
        // Edit
        setRecipes(prevRecipes => prevRecipes.map(r => r.id === event.id ? event : r));
      }
    });

    // Subscribe to clear events
    const unsubscribeClear = recipeEvents.subscribeToClear(() => {
      setRecipes([]);
    });

    // Subscribe to user profile updates
    const unsubscribeProfile = userProfileEvents.subscribe((profile) => {
      setUserProfile(profile);
    });

    // Cleanup subscription
    return () => {
      unsubscribe();
      unsubscribeClear();
      unsubscribeProfile();
    };
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
      setRecipes(data.recipes);
      setUserProfile(data.userProfile);
      // Check if profile needs completion after we have the latest data
      if (data.userProfile && (!data.userProfile.name || !data.userProfile.profile_picture_url)) {
        router.push({ 
          pathname: '/profile', 
          params: { 
            user: JSON.stringify(data.userProfile),
            needsProfile: 'true'
          }
        });
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch recipes');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getRecipes();
      setRecipes(data.recipes);
      setUserProfile(data.userProfile);
    } catch (err) {
      Alert.alert('Error', 'Failed to refresh recipes');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleLogout = async () => {
    await removeToken();
    router.replace('/auth');
  };

  const handleRecipePress = (recipe: any) => {
    console.log('List View - Original Recipe:', recipe);
    console.log('List View - Image URL:', recipe.image_url);
    console.log('List View - User Profile:', userProfile);
    // Get the image data from the Image component
    const imageData = {
      ...recipe,
      imageData: encodeURI(recipe.image_url) // Ensure URL is encoded
    };
    console.log('List View - Passing Image Data:', imageData);
    router.push({ 
      pathname: '/detail', 
      params: { 
        recipe: JSON.stringify(imageData),
        userId: userProfile?.id?.toString() || ''
      } 
    });
  };

  const renderItem = ({ item }: { item: any }) => (
    <RecipeGridItem
      item={item}
      onPress={() => handleRecipePress(item)}
      itemWidth={itemWidth}
      padding={padding}
    />
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          paddingHorizontal: 16,
          marginTop: 8,
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: '#000',
        }}
      >
        <Pressable 
          onPress={() => router.push({ pathname: '/profile', params: { user: JSON.stringify(userProfile) } })}
          style={{ padding: 8 }}
        >
          <View style={{ 
            width: 36, 
            height: 36, 
            borderRadius: 18,
            backgroundColor: '#E5E5EA',
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: '#000',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            {userProfile?.profile_picture_url && (
              <Image
                source={{ uri: userProfile.profile_picture_url }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            )}
          </View>
        </Pressable>
        <Text
          style={{
            flex: 1,
            fontSize: 24,
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          Meal Pack
        </Text>
        <Pressable onPress={() => router.push('/create')} style={{ padding: 4 }}>
          <Ionicons name="add" size={28} color="#007AFF" />
        </Pressable>
      </View>
      
      {/*
      {token && (
        <View>
          <Text>Your Auth Token:</Text>
          <Text>{token}</Text>
        </View>
      )}
      */}
{/* 
      <Pressable onPress={handleLogout}>
        <Text>Logout</Text>
      </Pressable> */}

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        recipes.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 64 }}>
            <Text style={{ textAlign: 'center', color: '#888', fontSize: 18, lineHeight: 26, maxWidth: 280 }}>
              You have no recipes. Create your first recipe or ask a friend to share one with you
            </Text>
          </View>
        ) : (
          <FlatList
            data={recipes}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={numColumns}
            contentContainerStyle={{ padding: padding, alignItems: 'center' }}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#000000"
                title="Pull to refresh"
                titleColor="#666666"
              />
            }
          />
        )
      )}
    </SafeAreaView>
  );
} 