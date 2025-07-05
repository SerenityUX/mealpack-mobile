import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, Text, View } from 'react-native';
import ContextMenu from 'react-native-context-menu-view';
import { createBook } from '../../utils/bookApi';

type TopBarProps = {
  userProfile: any;
  activeTab: 'recipes' | 'books';
  title?: string;
};

export default function TopBar({ userProfile, activeTab, title = 'Meal Pack' }: TopBarProps) {
  const router = useRouter();
  const [isCreatingBook, setIsCreatingBook] = useState(false);

  const handleCreateBook = async (bookName: string) => {
    if (!bookName || !bookName.trim()) return;
    
    try {
      setIsCreatingBook(true);
      
      // Use the user's profile picture as the book image
      const imageUrl = userProfile?.profile_picture_url || '';
      
      // Create the book
      const newBook = await createBook(bookName.trim(), imageUrl);
      console.log("Created new book:", newBook);
      
      // Navigate to the book detail page
      router.push({
        pathname: '/book/[id]',
        params: { id: newBook.id, book: JSON.stringify(newBook) }
      });
    } catch (error) {
      console.error('Error creating book:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create book');
    } finally {
      setIsCreatingBook(false);
    }
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 16,
        marginTop: 8,
        paddingBottom: 8,
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
        {title}
      </Text>
      <View style={{ flexDirection: 'row' }}>
        {isCreatingBook ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          activeTab === 'recipes' ? (
            <ContextMenu
              actions={[
                { title: 'Write Recipe', systemIcon: 'pencil' },
                { title: 'Generate Recipe', systemIcon: 'wand.and.stars' },
              ]}
              dropdownMenuMode={true}
              onPress={(e) => {
                if (e.nativeEvent.index === 0) {
                  // Write Recipe
                  router.push('/create');
                } else if (e.nativeEvent.index === 1) {
                  // Generate Recipe
                  router.push('/generate');
                }
              }}
            >
              <Pressable style={{ padding: 4 }}>
                <Ionicons name="add" size={28} color="#007AFF" />
              </Pressable>
            </ContextMenu>
          ) : (
            <ContextMenu
              actions={[
                { title: 'Create New Book', systemIcon: 'book' },
              ]}
              dropdownMenuMode={true}
              onPress={() => {
                // Create New Book
                Alert.prompt(
                  "What's the name of your book?",
                  "Enter a name for your new book",
                  [
                    {
                      text: "Cancel",
                      style: "cancel"
                    },
                    {
                      text: "Create",
                      onPress: handleCreateBook
                    }
                  ],
                  'plain-text'
                );
              }}
            >
              <Pressable style={{ padding: 4 }}>
                <Ionicons name="add" size={28} color="#007AFF" />
              </Pressable>
            </ContextMenu>
          )
        )}
      </View>
    </View>
  );
} 