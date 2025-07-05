import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, FlatList, Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopBar from '../../components/ui/TopBar';
import { getBooks } from '../../utils/bookApi';
import { bookEvents, userProfileEvents } from '../../utils/events';
import { getRecipes } from '../../utils/getRecipes';
import { useTranslation } from '../../utils/TranslationContext';

const BookGridItem = ({ item, onPress }: { item: any, onPress: () => void }) => {
  return (
    <Pressable 
      onPress={onPress}
      style={{
        width: '44%',
        aspectRatio: 0.75,
      }}
    >
      <View style={{
        flex: 1,
        backgroundColor: '#CD853F',
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
        justifyContent: 'center',
        alignItems: 'flex-end',
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        paddingRight: '5%',
        borderRightWidth: 2,
        borderRightColor: '#B8732E',
      }}>
        {/* Dotted line for book binding */}
        <View style={{
          position: 'absolute',
          left: '8%',
          top: 4,
          bottom: 4,
          width: 2,
          backgroundColor: '#B8732E',
          opacity: 0.7,
        }}>
          {Array.from({ length: 15 }).map((_, index) => (
            <View
              key={index}
              style={{
                position: 'absolute',
                left: 0,
                top: `${index * 7}%`,
                width: 2,
                height: 4,
                backgroundColor: '#FFF',
                opacity: 0.1,
              }}
            />
          ))}
        </View>

        {/* Right side content container */}
        <View style={{
          width: '80%',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Circle container with inner shadow */}
          <View style={{
            width: '80%',
            aspectRatio: 1,
            borderRadius: 999,
            backgroundColor: '#FFF',
            overflow: 'hidden',
            position: 'relative',
            marginBottom: 12,
          }}>
            {/* Inner shadow overlay */}
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 999,
              borderWidth: 2,
              borderColor: 'rgba(0,0,0,0.2)',
              zIndex: 1,
            }} />
            
            {item.author?.profile_picture ? (
              <Image
                source={{ uri: item.author.profile_picture }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <View style={{ 
                flex: 1, 
                justifyContent: 'center', 
                alignItems: 'center',
                backgroundColor: '#E5E5EA'
              }}>
                <Ionicons name="book" size={32} color="#B8732E" />
              </View>
            )}
          </View>

          {/* Book name */}
          <Text 
            numberOfLines={2}
            style={{
              fontSize: 14,
              color: '#B8732E',
              width: '80%',
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            {item.name}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default function BookScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<any[]>([]);
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    loadUserData();
    
    // Subscribe to user profile updates
    const unsubscribeProfile = userProfileEvents.subscribe((profile) => {
      setUserProfile(profile);
    });
    
    // Subscribe to book events
    const unsubscribeBooks = bookEvents.subscribe((event) => {
      if (event.type === 'delete') {
        // Remove the deleted book from the list
        setBooks(prevBooks => prevBooks.filter(book => book.id !== event.bookId));
      } else if (event.type === 'create') {
        // Add the new book to the beginning of the list
        setBooks(prevBooks => [event.book, ...prevBooks]);
      } else if (event.type === 'update') {
        // Update the existing book in the list
        setBooks(prevBooks => 
          prevBooks.map(book => 
            book.id === event.book.id ? event.book : book
          )
        );
      }
    });
    
    // Cleanup subscriptions
    return () => {
      unsubscribeProfile();
      unsubscribeBooks();
    };
  }, []);
  
  const loadUserData = async () => {
    try {
      setLoading(true);
      const data = await getRecipes();
      setUserProfile(data.userProfile);
      
      // Fetch books
      try {
        const booksData = await getBooks();
        setBooks(booksData || []);
      } catch (err) {
        console.error('Error fetching books:', err);
      }
      
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
      console.error('Error fetching user data:', err);
      Alert.alert('Error', 'Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  const navigateToList = () => {
    router.replace('/(tabs)/list');
  };
  
  const shakeSelectedTab = () => {
    Alert.alert('Books Tab already selected');
    
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
  };
  
  const handleBookPress = (book: any) => {
    router.push({
      pathname: '/book/[id]',
      params: { id: book.id, book: JSON.stringify(book) }
    });
  };
  
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <TopBar userProfile={userProfile} activeTab="books" />

      {/* Second layer with tabs */}
      <View style={{
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 16,
      }}>
        <View style={{ flex: 1 }}>
          <Pressable 
            onPress={navigateToList}
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
              Recipes
            </Text>
          </Pressable>
        </View>
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
              Books
            </Text>
          </Pressable>
        </Animated.View>
      </View>

      {/* Content area */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        books.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 64 }}>
            <Text style={{ textAlign: 'center', color: '#888', fontSize: 18, lineHeight: 26, maxWidth: 280 }}>
              You don't have any books yet. Press the + button to create your first book.
            </Text>
          </View>
        ) : (
          <FlatList
            data={books}
            renderItem={({ item }) => (
              <BookGridItem 
                item={item} 
                onPress={() => handleBookPress(item)} 
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 16 }}
            numColumns={2}
            columnWrapperStyle={{
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              marginBottom: 32
            }}
          />
        )
      )}
    </SafeAreaView>
  );
} 