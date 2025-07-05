import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import ContextMenu from 'react-native-context-menu-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deleteBook, shareBook } from '../../utils/bookApi';
import { bookEvents } from '../../utils/events';
import { getRecipes } from '../../utils/getRecipes';
import { useTranslation } from '../../utils/TranslationContext';

const RecipeGridItem = ({ item, onPress }: { item: any, onPress: () => void }) => {
  const screenWidth = Dimensions.get('window').width;
  const numColumns = 3;
  const padding = 16;
  const itemWidth = (screenWidth - (padding * (numColumns + 1))) / numColumns;

  return (
    <Pressable 
      onPress={onPress}
      style={{
        width: itemWidth,
        margin: padding / 2,
      }}
    >
      <View style={{
        aspectRatio: 3/4,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#000',
      }}>
        <Image
          source={{ uri: item.recipe?.image_url || item.image_url }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>
    </Pressable>
  );
};

const RecipeSelectionItem = ({ item, isSelected, onToggle }: { 
  item: any, 
  isSelected: boolean, 
  onToggle: () => void 
}) => {
  return (
    <Pressable 
      onPress={onToggle}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
        backgroundColor: isSelected ? '#E3F2FD' : 'transparent',
      }}
    >
      <Image
        source={{ uri: item.image_url }}
        style={{ width: 50, height: 50, borderRadius: 8, marginRight: 12 }}
        resizeMode="cover"
      />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '500' }}>{item.name}</Text>
        {item.description && (
          <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }} numberOfLines={1}>
            {item.description}
          </Text>
        )}
      </View>
      <View style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: isSelected ? '#007AFF' : '#C7C7CC',
        backgroundColor: isSelected ? '#007AFF' : 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        {isSelected && (
          <Ionicons name="checkmark" size={16} color="white" />
        )}
      </View>
    </Pressable>
  );
};

export default function BookDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [availableRecipes, setAvailableRecipes] = useState<any[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set());
  const [addingRecipes, setAddingRecipes] = useState(false);
  const [initiallySelectedRecipes, setInitiallySelectedRecipes] = useState<Set<string>>(new Set());
  const [userRecipeIds, setUserRecipeIds] = useState<Set<string>>(new Set());
  const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
  const [userRecipes, setUserRecipes] = useState<any[]>([]);
  const [modalRecipeList, setModalRecipeList] = useState<any[]>([]);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (params.book) {
      try {
        const bookData = JSON.parse(params.book as string);
        setBook(bookData);
        setUserId(bookData.author?.id?.toString() || null);
      } catch (error) {
        console.error('Error parsing book data:', error);
        Alert.alert('Error', 'Failed to load book details');
      }
    }
    setLoading(false);
  }, [params.book]);

  const loadAllRecipes = async () => {
    try {
      const data = await getRecipes();
      setAvailableRecipes(data.recipes);
      // Set user's recipe IDs
      setUserRecipeIds(new Set((data.recipes || []).map((r: any) => r.id.toString())));
      // Set initially selected recipes (those already in the book)
      const bookRecipeIds = new Set<string>(book?.pages?.map((page: any) => page.recipe.id.toString()) || []);
      setInitiallySelectedRecipes(bookRecipeIds);
      setSelectedRecipes(new Set<string>(bookRecipeIds));
    } catch (error) {
      console.error('Error loading recipes:', error);
      Alert.alert('Error', 'Failed to load recipes');
    }
  };

  const loadUserRecipeIds = async () => {
    try {
      const data = await getRecipes();
      setUserRecipeIds(new Set((data.recipes || []).map((r: any) => r.id.toString())));
    } catch (error) {
      console.error('Error loading user recipes:', error);
      Alert.alert('Error', 'Failed to load your recipes');
    }
  };

  // Build the union list for the modal
  const buildModalRecipeList = (bookPages: any[], userRecipes: any[]) => {
    const bookRecipeMap = new Map<string, any>();
    (bookPages || []).forEach((page: any) => {
      if (page.recipe && page.recipe.id) {
        bookRecipeMap.set(page.recipe.id.toString(), { ...page.recipe, _fromBook: true });
      }
    });
    (userRecipes || []).forEach((r: any) => {
      if (!bookRecipeMap.has(r.id.toString())) {
        bookRecipeMap.set(r.id.toString(), { ...r, _fromBook: false });
      }
    });
    return Array.from(bookRecipeMap.values());
  };

  const loadUserRecipesAndModalList = async () => {
    try {
      const data = await getRecipes();
      setUserRecipes(data.recipes || []);
      setUserRecipeIds(new Set((data.recipes || []).map((r: any) => r.id.toString())));
      // Build modal list: union of book pages and user recipes
      setModalRecipeList(buildModalRecipeList(book.pages, data.recipes || []));
      // Selected = all recipes currently in the book
      setSelectedRecipeIds(new Set((book.pages || []).map((page: any) => page.recipe.id.toString())));
    } catch (error) {
      console.error('Error loading user recipes:', error);
      Alert.alert('Error', 'Failed to load your recipes');
    }
  };

  const handleEditRecipes = async () => {
    await loadUserRecipesAndModalList();
    setShowRecipeModal(true);
  };

  const toggleRecipeSelection = (recipeId: string) => {
    const newSelected = new Set(selectedRecipeIds);
    if (newSelected.has(recipeId)) {
      newSelected.delete(recipeId);
    } else {
      newSelected.add(recipeId);
    }
    setSelectedRecipeIds(newSelected);
  };

  const handleSaveRecipeChanges = async () => {
    setAddingRecipes(true);
    try {
      // Recipes currently in the book
      const bookRecipeIds = new Set((book.pages || []).map((page: any) => page.recipe.id.toString()));
      // Recipes to add: selected but not in the book
      const recipesToAdd = Array.from(selectedRecipeIds).filter(id => !bookRecipeIds.has(id));
      // Recipes to remove: in the book but not selected
      const recipesToRemove = Array.from(bookRecipeIds).filter(id => !selectedRecipeIds.has(id));
      const recipesToAddStr = recipesToAdd.map(String);
      const recipesToRemoveStr = recipesToRemove.map(String);
      for (const recipeId of recipesToAddStr) {
        await addRecipeToBook(book.id, recipeId);
      }
      for (const recipeId of recipesToRemoveStr) {
        await removeRecipeFromBook(book.id, recipeId);
      }
      // Refresh the book data
      const updatedBookData = await refreshBookData();
      setBook(updatedBookData);
      if (recipesToAdd.length > 0 || recipesToRemove.length > 0) {
        bookEvents.emit({ type: 'update', book: updatedBookData });
      }
      setShowRecipeModal(false);
      if (recipesToAdd.length > 0 && recipesToRemove.length > 0) {
        Alert.alert('Success', `Added ${recipesToAdd.length} and removed ${recipesToRemove.length} recipe(s)`);
      } else if (recipesToAdd.length > 0) {
        Alert.alert('Success', `Added ${recipesToAdd.length} recipe(s) to the book`);
      } else if (recipesToRemove.length > 0) {
        Alert.alert('Success', `Removed ${recipesToRemove.length} recipe(s) from the book`);
      } else {
        Alert.alert('No Changes', 'No recipes were added or removed');
      }
    } catch (error) {
      console.error('Error updating recipes:', error);
      Alert.alert('Error', 'Failed to update recipes in book');
    } finally {
      setAddingRecipes(false);
    }
  };

  const addRecipeToBook = async (bookId: string, recipeId: string) => {
    const auth_token = await import('@react-native-async-storage/async-storage').then(module => 
      module.default.getItem('auth_token')
    );
    
    if (!auth_token) {
      throw new Error('No auth token found');
    }

    const response = await fetch('https://serenidad.click/mealpack/addBookPage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_token,
        book_id: bookId,
        recipe_id: recipeId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add recipe to book');
    }

    return response.json();
  };

  const removeRecipeFromBook = async (bookId: string, recipeId: string) => {
    const auth_token = await import('@react-native-async-storage/async-storage').then(module => 
      module.default.getItem('auth_token')
    );
    
    if (!auth_token) {
      throw new Error('No auth token found');
    }

    const response = await fetch('https://serenidad.click/mealpack/removeBookPage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_token,
        book_id: bookId,
        recipe_id: recipeId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to remove recipe from book');
    }

    return response.json();
  };

  const refreshBookData = async () => {
    // Re-fetch the book data to get updated pages
    const auth_token = await import('@react-native-async-storage/async-storage').then(module => 
      module.default.getItem('auth_token')
    );
    
    if (!auth_token) {
      throw new Error('No auth token found');
    }

    const response = await fetch('https://serenidad.click/mealpack/getBooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ auth_token }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh book data');
    }

    const data = await response.json();
    const updatedBook = data.books.find((b: any) => b.id === book.id);
    return updatedBook;
  };

  const handleRecipePress = (recipe: any) => {
    // Use the full recipe data from the book page
    const fullRecipe = recipe.recipe || recipe;
    
    router.push({
      pathname: '/detail',
      params: {
        recipe: JSON.stringify({
          id: fullRecipe.id,
          name: fullRecipe.name,
          description: fullRecipe.description,
          image_url: fullRecipe.image_url,
          imageData: fullRecipe.image_url,
          author: fullRecipe.author,
          ingredients: fullRecipe.ingredients,
          directions: fullRecipe.directions,
          created_at: fullRecipe.created_at,
          shares: fullRecipe.shares || [],
        }),
        userId: userId || '',
      },
    });
  };

  const handleDeleteBook = async () => {
    if (!book) return;
    
    try {
      await deleteBook(book.id);
      bookEvents.emit({ type: 'delete', bookId: book.id });
      
      Alert.alert('Success', 'Book deleted successfully', [
        {
          text: 'OK',
          onPress: () => {
            router.back();
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete book');
    }
  };

  const handleShareByEmail = async () => {
    if (!book) return;

    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Share Book by Email',
        'Enter email address to share with:',
        async (email) => {
          if (!email) return;
          
          try {
            await shareBook(book.id, email);
            Alert.alert('Success', 'Book shared successfully');
          } catch (error: any) {
            if (error.message.includes('User with provided email not found')) {
              Alert.alert('User Not Found', 'No user found with that email address');
            } else if (error.message.includes('Book already shared with this user')) {
              Alert.alert('Already Shared', 'This book is already shared with that user');
            } else {
              Alert.alert('Error', error.message || 'Failed to share book');
            }
          }
        },
        'plain-text',
      );
    } else {
      Alert.prompt(
        'Share Book by Email',
        'Enter email address to share with:',
        async (email) => {
          if (!email) return;
          
          try {
            await shareBook(book.id, email);
            Alert.alert('Success', 'Book shared successfully');
          } catch (error: any) {
            if (error.message.includes('User with provided email not found')) {
              Alert.alert('User Not Found', 'No user found with that email address');
            } else if (error.message.includes('Book already shared with this user')) {
              Alert.alert('Already Shared', 'This book is already shared with that user');
            } else {
              Alert.alert('Error', error.message || 'Failed to share book');
            }
          }
        },
        'plain-text',
      );
    }
  };

  useLayoutEffect(() => {
    if (book && book.name) {
      const actions = [
        { title: 'Share by Email', systemIcon: 'envelope' },
        { title: 'Delete', systemIcon: 'trash', destructive: true },
      ];
      
      navigation.setOptions({
        title: book.name,
        headerRight: () => (
          <ContextMenu
            actions={actions}
            dropdownMenuMode={true}
            onPress={(e) => {
              if (e.nativeEvent.index === 0) {
                handleShareByEmail();
              } else if (e.nativeEvent.index === 1) {
                Alert.alert(
                  'Delete Book',
                  'Are you sure you want to delete this book?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: handleDeleteBook,
                    },
                  ],
                );
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
  }, [navigation, book, userId]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!book) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No book data available</Text>
      </SafeAreaView>
    );
  }

  const recipeCount = book.pages?.length || 0;
  const screenWidth = Dimensions.get('window').width;
  const numColumns = 3;
  const padding = 16;

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
      <ScrollView>
        <View style={{ padding: 16 }}>
          {/* Book Name */}
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>{book.name}</Text>
          
          {/* Author info */}
          {book.author && (
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              marginBottom: 20,
              borderBottomWidth: 1,
              borderBottomColor: '#E5E5EA',
              paddingBottom: 16
            }}>
              {book.author.profile_picture && (
                <Image 
                  source={{ uri: book.author.profile_picture }} 
                  style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }} 
                />
              )}
              <Text style={{ fontSize: 17 }}>{book.author.name}</Text>
            </View>
          )}
          
          {/* Recipes header with count and Edit button */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
              Recipes ({recipeCount})
            </Text>
            <Pressable
              onPress={handleEditRecipes}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text style={{ fontSize: 16, color: '#007AFF' }}>Edit Recipes</Text>
            </Pressable>
          </View>
          
          {/* Recipes grid */}
          {book.pages && book.pages.length > 0 ? (
            <FlatList
              data={book.pages}
              renderItem={({ item }) => (
                <RecipeGridItem 
                  item={item} 
                  onPress={() => handleRecipePress(item)} 
                />
              )}
              keyExtractor={(item) => item.id.toString()}
              numColumns={numColumns}
              scrollEnabled={false}
              contentContainerStyle={{ alignItems: 'center' }}
            />
          ) : (
            <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', marginTop: 32 }}>
              No recipes in this book yet.
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Recipe Selection Modal */}
      <Modal
        visible={showRecipeModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E5EA',
          }}>
            <Pressable onPress={() => setShowRecipeModal(false)}>
              <Text style={{ fontSize: 16, color: '#007AFF' }}>Cancel</Text>
            </Pressable>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Edit Recipes</Text>
            <Pressable
              onPress={handleSaveRecipeChanges}
              disabled={addingRecipes}
            >
              <Text style={{ 
                fontSize: 16, 
                color: addingRecipes ? '#C7C7CC' : '#007AFF',
                fontWeight: '600'
              }}>
                {addingRecipes ? 'Saving...' : 'Save'}
              </Text>
            </Pressable>
          </View>
          
          <FlatList
            data={modalRecipeList}
            renderItem={({ item }) => (
              <RecipeSelectionItem
                item={item}
                isSelected={selectedRecipeIds.has(item.id.toString())}
                onToggle={() => toggleRecipeSelection(item.id.toString())}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            style={{ flex: 1 }}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
} 