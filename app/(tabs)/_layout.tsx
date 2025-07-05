import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useTranslation } from '../../utils/TranslationContext';

export default function TabsLayout() {
  const { t } = useTranslation();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          display: 'none',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="list"
        options={{
          title: 'Pack',
          tabBarIcon: ({ color, size }) => {
            // Use SF Symbols on iOS and MaterialCommunityIcons on Android
            return Platform.OS === 'ios' ? (
                <MaterialCommunityIcons name="bag-personal" size={size} color={color} />
            ) : (
              <MaterialCommunityIcons name="bag-personal" size={size} color={color} />
            );
          },
        }}
      />
      <Tabs.Screen
        name="book"
        options={{
          title: 'Books',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
} 