import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useLayoutEffect } from 'react';
import { ActionSheetIOS, Alert, Image, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import ContextMenu from 'react-native-context-menu-view';

export default function DetailView() {
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  let recipe = null;
  if (params.recipe) {
    try {
      recipe = JSON.parse(params.recipe as string);
    } catch {}
  }

  // ActionSheet handler
  const showActionSheet = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Delete', 'Share'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
          userInterfaceStyle: 'light',
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            // Delete
            Alert.alert('Delete pressed');
          } else if (buttonIndex === 2) {
            // Share
            Alert.alert('Share pressed');
          }
        }
      );
    } else {
      // Fallback for Android
      Alert.alert(
        'Options',
        '',
        [
          { text: 'Delete', onPress: () => Alert.alert('Delete pressed'), style: 'destructive' },
          { text: 'Share', onPress: () => Alert.alert('Share pressed') },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  useLayoutEffect(() => {
    if (recipe && recipe.name) {
      navigation.setOptions({
        title: recipe.name,
        headerRight: () => (
          <ContextMenu
            actions={[
              { title: 'Share', systemIcon: 'square.and.arrow.up' },
              { title: 'Delete', systemIcon: 'trash', destructive: true },
            ]}
            dropdownMenuMode={true}
            onPress={e => {
              if (e.nativeEvent.index === 0) {
                // Handle delete
              } else if (e.nativeEvent.index === 1) {
                // Handle share
              }
            }}
          >
            <Pressable hitSlop={10} style={{ paddingHorizontal: 10 }}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#222" />
            </Pressable>
          </ContextMenu>
        ),
      });
    }
  }, [navigation, recipe]);

  if (!recipe) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>No recipe data.</Text></View>;
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
      {/* Recipe Image */}
      {recipe.image_url && (
        <View style={{ width: '100%', aspectRatio: 3/4, borderRadius: 0, overflow: 'hidden', marginBottom: 16 }}>
          <Image
            source={{ uri: recipe.image_url }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </View>
      )}
      <View style={{ paddingHorizontal: 20 }}>
        {/* Description */}
        {recipe.description && (
          <Text style={{ fontSize: 16, marginBottom: 12 }}>{recipe.description}</Text>
        )}
        {/* Author */}
        {recipe.author && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
            {recipe.author.profile_picture && (
              <Image
                source={{ uri: recipe.author.profile_picture }}
                style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10 }}
              />
            )}
            <Text style={{ fontSize: 15 }}>{recipe.author.name}</Text>
          </View>
        )}
        {/* Ingredients */}
        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <View style={{ marginBottom: 18 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>Ingredients</Text>
            {recipe.ingredients.map((item: any, idx: number) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Text style={{ marginRight: 6 }}>•</Text>
                <Text style={{ flex: 1 }}>{item.text || item}</Text>
              </View>
            ))}
          </View>
        )}
        {/* Directions */}
        {recipe.directions && recipe.directions.length > 0 && (
          <View style={{ marginBottom: 18 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>Directions</Text>
            {recipe.directions.map((item: any, idx: number) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Text style={{ marginRight: 6 }}>{idx + 1}.</Text>
                <Text style={{ flex: 1 }}>{item.text || item}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
} 