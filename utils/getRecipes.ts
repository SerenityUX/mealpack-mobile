import { getToken } from './token';

export const getRecipes = async () => {
  const token = await getToken();
  if (!token) {
    throw new Error('No auth token found');
  }

  const response = await fetch('https://serenidad.click/mealpack/auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ auth_token: token }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch recipes');
  }

  const data = await response.json();
  return {
    recipes: data.recipes,
    userProfile: data.user_profile
  };
};

export async function addToMyPack(recipeId: string) {
  const auth_token = await import('@react-native-async-storage/async-storage').then(module => 
    module.default.getItem('auth_token')
  );
  if (!auth_token) throw new Error('No auth token found');
  const response = await fetch('https://serenidad.click/mealpack/addToMyPack', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ auth_token, recipe_id: recipeId })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to add recipe to pack');
  return data.recipe;
}
