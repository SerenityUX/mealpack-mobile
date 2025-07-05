import AsyncStorage from '@react-native-async-storage/async-storage';
import { bookEvents } from './events';
import { getToken } from './token';

const API_URL = 'https://serenidad.click/mealpack';

export const createBook = async (bookName: string, imageUrl: string) => {
  const token = await getToken();
  if (!token) {
    throw new Error('No auth token found');
  }

  const response = await fetch('https://serenidad.click/mealpack/createBook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_token: token,
      book_name: bookName,
      image_url: imageUrl
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create book');
  }

  const data = await response.json();
  
  // Emit book creation event
  bookEvents.emit({ type: 'create', book: data.book });
  
  return data.book;
};

export async function getBooks() {
  try {
    const auth_token = await AsyncStorage.getItem('auth_token');
    if (!auth_token) {
      throw new Error('No auth token found');
    }

    const response = await fetch(`${API_URL}/getBooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ auth_token }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch books');
    }

    const data = await response.json();
    return data.books;
  } catch (error) {
    console.error('Error in getBooks:', error);
    throw error;
  }
}

export async function deleteBook(bookId: string) {
  try {
    const auth_token = await AsyncStorage.getItem('auth_token');
    if (!auth_token) {
      throw new Error('No auth token found');
    }

    const response = await fetch(`${API_URL}/deleteBook`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ auth_token, book_id: bookId }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete book');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in deleteBook:', error);
    throw error;
  }
}

export async function shareBook(bookId: string, email: string) {
  try {
    const auth_token = await AsyncStorage.getItem('auth_token');
    if (!auth_token) {
      throw new Error('No auth token found');
    }

    const response = await fetch(`${API_URL}/shareBook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ auth_token, book_id: bookId, email }),
    });

    if (!response.ok) {
      throw new Error('Failed to share book');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in shareBook:', error);
    throw error;
  }
}

const handleAddToMyPack = async () => {
  try {
    await addToMyPack(currentRecipe.id);
    // Re-fetch recipes to update state
    const data = await getRecipes();
    setUserRecipes(data.recipes || []);
    recipeEvents.emit('refresh'); // or emit the new recipe if you want
    Alert.alert(t('success'), 'Recipe added to your recipes!');
  } catch (error: any) {
    Alert.alert(t('error'), error.message || 'Failed to add recipe');
  }
}; 