import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getRecipes() {
  const auth_token = await AsyncStorage.getItem('auth_token');
  if (!auth_token) throw new Error('No auth token found');

  const response = await fetch('https://serenidad.click/mealpack/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ auth_token }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch recipes');
  }

  const data = await response.json();
  return data.recipes;
}
