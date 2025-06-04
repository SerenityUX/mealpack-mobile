import AsyncStorage from '@react-native-async-storage/async-storage';

export const getToken = async () => {
  try {
    return await AsyncStorage.getItem('auth_token');
  } catch (error) {
    console.log('[MealPack] Error getting token:', error);
    return null;
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem('auth_token');
    console.log('[MealPack] Token removed successfully');
  } catch (error) {
    console.log('[MealPack] Error removing token:', error);
  }
}; 