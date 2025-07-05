import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, FlatList, Image, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopBar from '../../components/ui/TopBar';
import { recipeEvents, userProfileEvents } from '../../utils/events';
import { getRecipes } from '../../utils/getRecipes';
import { getToken, removeToken } from '../../utils/token';
import { useTranslation } from '../../utils/TranslationContext';

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
  const { t } = useTranslation();
  const [token, setToken] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const numColumns = 3;
  const padding = 16;
  const itemWidth = (screenWidth - (padding * (numColumns + 1))) / numColumns;
  const soundRef = useRef<Audio.Sound | null>(null);
  
  // Track which items have already played sounds/haptics
  const viewedItemsRef = useRef<Set<string>>(new Set());
  
  // Reset tracked items when recipes change
  useEffect(() => {
    viewedItemsRef.current = new Set();
  }, [recipes]);
  
  // Setup audio
  useEffect(() => {
    const setupAudio = async () => {
      try {
        // Request audio permissions and configure audio mode
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        }).catch(() => {});
        
        // Pre-load sound for faster playback
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/popSound.mp3'),
          { shouldPlay: false }
        ).catch(() => ({ sound: null }));
        
        if (sound) {
          soundRef.current = sound;
        }
      } catch (error) {
        // Silently ignore errors
      }
    };
    
    setupAudio();
    
    // Clean up sound on unmount
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  // Function to play the pop sound
  const playPopSound = async () => {
    try {
      let sound = soundRef.current;
      
      // If we don't have a pre-loaded sound, create a new one
      if (!sound) {
        const soundObject = await Audio.Sound.createAsync(
          require('../../assets/popSound.mp3'),
          { shouldPlay: false }
        );
        sound = soundObject.sound;
        soundRef.current = sound;
      }
      
      // Reset and play the sound
      await sound.setPositionAsync(0).catch(() => {});
      await sound.playAsync().catch(() => {});
    } catch (error) {
      // Silently ignore errors
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    // Filter to only items that haven't been viewed yet
    const newItems = viewableItems.filter(({ item }) => {
      const itemId = item.id.toString();
      if (!viewedItemsRef.current.has(itemId)) {
        viewedItemsRef.current.add(itemId);
        return true;
      }
      return false;
    });
    
    // Only play sound and haptics for new items
    if (newItems.length > 0) {
      // Play haptic for the first new item
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } catch (e) {
        // Silently ignore haptic errors
      }
      
      // Play sound for the first new item
      playPopSound();
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 300,
  }).current;

  useEffect(() => {
    loadToken();
    fetchRecipes();
    
    // Subscribe to recipe deletion and edit events
    const unsubscribe = recipeEvents.subscribe((event: any) => {
      if (typeof event === 'string') {
        // Delete
        setRecipes(prevRecipes => prevRecipes.filter(r => r.id.toString() !== event));
      } else if (event && typeof event === 'object' && event.id) {
        // Edit or new recipe from QR code
        setRecipes(prevRecipes => {
          const existingRecipeIndex = prevRecipes.findIndex(r => r.id === event.id);
          if (existingRecipeIndex >= 0) {
            // Edit existing recipe
            return prevRecipes.map(r => r.id === event.id ? event : r);
          } else {
            // New recipe (from QR code or other source)
            // Add the recipe ID to the viewed set to prevent duplicate sounds
            viewedItemsRef.current.add(event.id.toString());
            
            // Play sound for new recipe
            setTimeout(() => {
              try {
                playPopSound();
              } catch (e) {
                // Silently ignore sound errors
              }
            }, 300);
            return [event, ...prevRecipes];
          }
        });
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

    // Subscribe to refresh events
    const refreshUnsubscribe = recipeEvents.subscribe((event) => {
      if (event === 'refresh') {
        fetchRecipes();
      }
    });

    // Cleanup subscription
    return () => {
      unsubscribe();
      unsubscribeClear();
      unsubscribeProfile();
      refreshUnsubscribe();
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
      Alert.alert(t('error'), 'Failed to refresh recipes');
    } finally {
      setRefreshing(false);
    }
  }, [t]);

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

  const handleEnterShareCode = () => {
    Alert.prompt(
      t('enterShareCode'),
      t('enterCodeToClaimRecipe'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('claim'),
          onPress: (code) => {
            if (code && code.trim()) {
              claimShareCode(code.trim());
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const claimShareCode = async (shareCode: string) => {
    try {
      const auth_token = await getToken();
      if (!auth_token) {
        Alert.alert(
          t('loginRequired'),
          t('needLoginToClaimRecipe'),
          [
            {
              text: t('ok'),
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

      // Format the recipe data to match what detail.tsx expects
      const formattedRecipe = {
        ...data.recipe,
        imageData: data.recipe.image_url, // Add imageData field with the image URL
        image_url: data.recipe.image_url  // Ensure image_url is available for the list view
      };
      
      // Add the new recipe to the state
      setRecipes(prevRecipes => [formattedRecipe, ...prevRecipes]);
      
      // Add the recipe ID to the viewed set to prevent duplicate sounds
      viewedItemsRef.current.add(formattedRecipe.id.toString());
      
      // Play pop sound for the new recipe with a slight delay
      setTimeout(() => {
        try {
          playPopSound();
        } catch (e) {
          // Silently ignore sound errors
        }
      }, 300);

      // Show thank you message with sharer's info
      if (data.shared_by) {
        Alert.alert(
          t('recipeAdded'),
          `Thanks to ${data.shared_by.name}, you now have ${data.recipe.name} in your Meal Pack. Enjoy!`,
          [
            {
              text: t('viewRecipe'),
              onPress: () => {
                // Navigate to the detail page
                router.push({
                  pathname: '/detail',
                  params: {
                    recipe: JSON.stringify(formattedRecipe),
                    userId: userProfile?.id?.toString() || '',
                    sharedBy: JSON.stringify(data.shared_by)
                  }
                });
              }
            }
          ]
        );
      } else {
        // Navigate directly to the detail page
        router.push({
          pathname: '/detail',
          params: {
            recipe: JSON.stringify(formattedRecipe),
            userId: userProfile?.id?.toString() || ''
          }
        });
      }
    } catch (error: any) {
      Alert.alert(t('error'), error.message || 'Failed to claim recipe');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <RecipeGridItem
      item={item}
      onPress={() => handleRecipePress(item)}
      itemWidth={itemWidth}
      padding={padding}
    />
  );

  const navigateToBooks = () => {
    router.replace('/(tabs)/book');
  };

  const shakeAnimation = useRef(new Animated.Value(0)).current;
  
  const shakeSelectedTab = () => {
    // Alert that this tab is already selected
    Alert.alert('Recipes Tab already selected');
    
    // Create a sequence of animations for shaking
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <TopBar userProfile={userProfile} activeTab="recipes" title={t('appTitle')} />

      {/* Second layer with tabs */}
      <View style={{
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 16,
      }}>
        <Animated.View
          style={{
            flex: 1,
            transform: [{ translateX: shakeAnimation }]
          }}
        >
          <Pressable 
            onPress={shakeSelectedTab}
            style={{
              width: '100%',
              paddingVertical: 8,
              paddingHorizontal: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#000',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#000',
            }}
          >
            <Text style={{ 
              fontSize: 16, 
              color: '#fff',
            }}>
              Recipes
            </Text>
          </Pressable>
        </Animated.View>
        <View style={{ flex: 1 }}>
          <Pressable 
            onPress={navigateToBooks}
            style={{
              width: '100%',
              paddingVertical: 8,
              paddingHorizontal: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#fff',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#000',
            }}
          >
            <Text style={{ 
              fontSize: 16, 
              color: '#000',
            }}>
              Books
            </Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        recipes.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 64 }}>
            <Text style={{ textAlign: 'center', color: '#888', fontSize: 18, lineHeight: 26, maxWidth: 280 }}>
              {t('noRecipesMessage')}
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
                title={t('pullToRefresh')}
                titleColor="#666666"
              />
            }
          />
        )
      )}
    </SafeAreaView>
  );
} 