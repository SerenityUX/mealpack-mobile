import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import ContextMenu from 'react-native-context-menu-view';
import { recipeEvents, userProfileEvents } from '../utils/events';
import { getToken, removeToken } from '../utils/token';
import { useTranslation } from '../utils/TranslationContext';
import { Language } from '../utils/translations';

const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function ProfileView() {
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();
  
  let user = null;
  if (params.user) {
    try {
      user = JSON.parse(params.user as string);
    } catch (e) {
      user = null;
    }
  }

  const needsProfile = params.needsProfile === 'true';

  const [uploading, setUploading] = useState(false);
  const [profilePic, setProfilePic] = useState(user?.profile_picture_url || null);
  const [editingName, setEditingName] = useState(needsProfile && !user?.name);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [currentName, setCurrentName] = useState(user?.name || '');

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('profile') });
  }, [navigation, language]);

  const handleLanguageChange = async (newLanguage: Language) => {
    await setLanguage(newLanguage);
  };

  const handleSignOut = async () => {
    recipeEvents.emitClear();
    await removeToken();
    await AsyncStorage.removeItem('user_profile');
    router.replace('/auth');
  };

  const handleDeleteAccount = () => {
    Alert.prompt(
      t('deleteAccount'),
      t('deleteAccountPrompt'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async (text) => {
            if (text === 'Delete My Account') {
              try {
                const token = await getToken();
                if (!token) {
                  Alert.alert(t('error'), 'You must be logged in to delete your account.');
                  return;
                }

                const response = await fetch('https://serenidad.click/mealpack/deleteAccount', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ auth_token: token }),
                });

                if (!response.ok) {
                  const data = await response.json();
                  throw new Error(data.error || 'Failed to delete account');
                }

                // Clear local storage and navigate to auth
                recipeEvents.emitClear();
                await removeToken();
                await AsyncStorage.removeItem('user_profile');
                router.replace('/auth');
              } catch (error: any) {
                Alert.alert(t('error'), error.message || 'Failed to delete account');
              }
            } else {
              Alert.alert(t('error'), 'Please type "Delete My Account" exactly to confirm deletion.');
            }
          },
        },
      ],
      'plain-text',
      '',
      'default'
    );
  };

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }
    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!result.canceled) {
      uploadProfilePicture(result.assets[0].uri);
    }
  };

  const uploadProfilePicture = async (uri: string) => {
    try {
      const prevPic = profilePic;
      setProfilePic(uri); // Optimistically update
      userProfileEvents.emit({ ...user, profile_picture_url: uri, name: currentName });
      setUploading(true);
      const token = await getToken();
      if (!token) {
        alert('You must be logged in to update your profile picture.');
        setProfilePic(prevPic);
        userProfileEvents.emit({ ...user, profile_picture_url: prevPic, name: currentName });
        return;
      }
      const formData = new FormData();
      formData.append('auth_token', token);
      const filename = uri.split('/').pop() || 'profile.jpg';
      const match = /\.([a-zA-Z0-9]+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;
      formData.append('file', {
        uri,
        name: filename,
        type,
      } as any);
      const response = await fetch('https://serenidad.click/mealpack/updatePfp', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        setProfilePic(prevPic);
        userProfileEvents.emit({ ...user, profile_picture_url: prevPic, name: currentName });
        throw new Error(data.error || 'Failed to upload profile picture');
      }
      setProfilePic(data.profile_picture_url);
      userProfileEvents.emit({ ...user, profile_picture_url: data.profile_picture_url, name: currentName });
      Alert.alert(t('success'), t('profilePictureUpdated'));
    } catch (error: any) {
      setProfilePic(user?.profile_picture_url || null);
      userProfileEvents.emit({ ...user, profile_picture_url: user?.profile_picture_url || null, name: currentName });
      Alert.alert(t('error'), error.message || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleNameSave = async () => {
    if (!nameInput.trim() || nameInput.trim() === currentName) {
      setEditingName(false);
      setNameInput(currentName);
      return;
    }
    const prevName = currentName;
    setCurrentName(nameInput.trim()); // Optimistically update
    userProfileEvents.emit({ ...user, profile_picture_url: profilePic, name: nameInput.trim() });
    try {
      setSavingName(true);
      const token = await getToken();
      if (!token) {
        alert('You must be logged in to update your name.');
        setCurrentName(prevName);
        userProfileEvents.emit({ ...user, profile_picture_url: profilePic, name: prevName });
        return;
      }
      const response = await fetch('https://serenidad.click/mealpack/updateName', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auth_token: token, name: nameInput.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setCurrentName(prevName);
        userProfileEvents.emit({ ...user, profile_picture_url: profilePic, name: prevName });
        throw new Error(data.error || 'Failed to update name');
      }
      setEditingName(false);
      userProfileEvents.emit({ ...user, profile_picture_url: profilePic, name: nameInput.trim() });
      Alert.alert(t('success'), t('nameUpdated'));
    } catch (error: any) {
      setCurrentName(prevName);
      userProfileEvents.emit({ ...user, profile_picture_url: profilePic, name: prevName });
      Alert.alert(t('error'), error.message || 'Failed to update name');
    } finally {
      setSavingName(false);
    }
  };

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text>No user data found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ alignItems: 'center', padding: 24 }}>
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        {/* Avatar with edit bubble or upload prompt */}
        {profilePic ? (
          <Pressable onPress={pickImage} style={{ alignSelf: 'center' }} disabled={uploading}>
            <View style={{
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: '#E5E5EA',
              overflow: 'hidden',
              borderWidth: 2,
              borderColor: '#000',
              marginBottom: 24,
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
            }}>
              <Image
                source={{ uri: profilePic }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
              {uploading && (
                <View style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 2,
                }}>
                  <ActivityIndicator size="large" color="#007AFF" />
                </View>
              )}
            </View>
            <View style={{
              position: 'absolute',
              bottom: 16,
              right: 0,
              backgroundColor: '#fff',
              borderRadius: 20,
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#ccc',
              zIndex: 10,
            }}>
              <Ionicons name="pencil" size={20} color="#222" />
            </View>
          </Pressable>
        ) : (
          <Pressable onPress={pickImage} style={{ alignSelf: 'center' }} disabled={uploading}>
            <View style={{
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: '#E5E5EA',
              overflow: 'hidden',
              borderWidth: 2,
              borderColor: '#000',
              marginBottom: 24,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#888', fontSize: 16, textAlign: 'center', paddingHorizontal: 10 }}>
                {needsProfile ? t('tapToUploadProfilePicture') : t('uploadProfilePicture')}
              </Text>
              {uploading && (
                <View style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 2,
                }}>
                  <ActivityIndicator size="large" color="#007AFF" />
                </View>
              )}
            </View>
          </Pressable>
        )}
        {/* Editable name row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          {editingName || (needsProfile && !currentName) ? (
            <>
              <TextInput
                value={nameInput}
                onChangeText={setNameInput}
                style={{
                  fontSize: 26,
                  fontWeight: 'bold',
                  color: '#111',
                  borderBottomWidth: 1,
                  borderBottomColor: '#007AFF',
                  minWidth: 120,
                  paddingVertical: 2,
                  marginRight: 8,
                }}
                editable={!savingName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleNameSave}
                placeholder={needsProfile ? t('inputName') : ''}
              />
              <Pressable onPress={handleNameSave} disabled={savingName} style={{ padding: 4 }}>
                {savingName ? (
                  <ActivityIndicator size={20} color="#007AFF" />
                ) : (
                  <Ionicons name="checkmark" size={26} color="#007AFF" />
                )}
              </Pressable>
            </>
          ) : (
            <>
              <Pressable onPress={() => setEditingName(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#111', marginRight: 6 }}>{needsProfile && !currentName ? t('inputName') : currentName}</Text>
                <Ionicons name="pencil" size={20} color="#888" />
              </Pressable>
            </>
          )}
        </View>
        <Text style={{ fontSize: 18, color: '#666', marginBottom: 8 }}>{user.email || t('guestUser')}</Text>
      </View>

      {/* Connect Email Section for Guest Users */}
      {!user.email && (
        <View style={{ width: '100%', marginBottom: 24 }}>
          <View style={{ height: 1, backgroundColor: '#E5E5EA', width: '100%', marginBottom: 16 }} />
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>{t('connectYourEmail')}</Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
            {t('connectEmailDescription')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <TextInput
              style={{
                flex: 1,
                height: 40,
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 5,
                paddingHorizontal: 10,
                marginRight: 10
              }}
              placeholder={t('enterYourEmail')}
              keyboardType="email-address"
              autoCapitalize="none"
              value={nameInput}
              onChangeText={setNameInput}
            />
            <Pressable
              onPress={async () => {
                if (!nameInput.trim() || !isValidEmail(nameInput.trim())) {
                  Alert.alert(t('error'), 'Please enter a valid email address');
                  return;
                }
                try {
                  setSavingName(true);
                  const token = await getToken();
                  if (!token) {
                    Alert.alert(t('error'), 'You must be logged in to connect your email');
                    return;
                  }
                  const response = await fetch('https://serenidad.click/mealpack/connectGuestAccount', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ auth_token: token, email: nameInput.trim() }),
                  });
                  const data = await response.json();
                  if (!response.ok) {
                    throw new Error(data.error || 'Failed to connect email');
                  }
                  // Update local storage and refresh
                  const updatedUser = { ...user, email: nameInput.trim() };
                  await AsyncStorage.setItem('user_profile', JSON.stringify(updatedUser));
                  userProfileEvents.emit(updatedUser);
                  Alert.alert(t('success'), t('emailConnectedSuccessfully'));
                  router.replace('/auth');
                } catch (error: any) {
                  Alert.alert(t('error'), error.message || 'Failed to connect email');
                } finally {
                  setSavingName(false);
                }
              }}
              style={{
                backgroundColor: '#000000',
                paddingHorizontal: 15,
                paddingVertical: 10,
                borderRadius: 5,
                height: 40,
                justifyContent: 'center',
                opacity: savingName ? 0.7 : 1
              }}
              disabled={savingName}
            >
              {savingName ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: 'white' }}>{t('connect')}</Text>
              )}
            </Pressable>
          </View>
        </View>
      )}

      {/* Divider and Actions */}
      <View style={{ width: '100%', marginTop: 0 }}>
        {/* Divider */}
        <View style={{ height: 1, backgroundColor: '#E5E5EA', width: '100%' }} />


          <Pressable
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 18,
              paddingHorizontal: 0,
              width: '100%',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="language-outline" size={22} color="#222" style={{ marginRight: 14, marginLeft: 8 }} />
              <Text style={{ color: '#222', fontSize: 17, fontWeight: '400' }}>{t('language')}</Text>
            </View>
                    {/* Language Selection Row */}
        <ContextMenu
          actions={[
            { title: 'English', systemIcon: 'globe.americas' },
            { title: '中文 (Mandarin)', systemIcon: 'globe.asia.australia' },
            { title: 'Español (Spanish)', systemIcon: 'globe.europe.africa' },
          ]}
          dropdownMenuMode={true}
          onPress={(e: { nativeEvent: { index: number } }) => {
            if (e.nativeEvent.index === 0) {
              handleLanguageChange('English');
            } else if (e.nativeEvent.index === 1) {
              handleLanguageChange('Mandarin');
            } else if (e.nativeEvent.index === 2) {
              handleLanguageChange('Spanish');
            }
          }}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ marginRight: 8, color: '#666' }}>
                {language === 'Mandarin' ? '中文' : language === 'Spanish' ? 'Español' : 'English'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#999" />
            </View>
        </ContextMenu>
                  </Pressable>

        <View style={{ height: 1, backgroundColor: '#E5E5EA', width: '100%' }} />

        {/* Sign out row */}
        <Pressable
          onPress={handleSignOut}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 18,
            paddingHorizontal: 0,
            width: '100%',
          }}
        >
          <Ionicons name="log-out-outline" size={22} color="#222" style={{ marginRight: 14, marginLeft: 8 }} />
          <Text style={{ color: '#222', fontSize: 17, fontWeight: '400' }}>{t('signOut')}</Text>
        </Pressable>
        <View style={{ height: 1, backgroundColor: '#E5E5EA', width: '100%' }} />

        {/* Delete Account row */}
        <Pressable
          onPress={handleDeleteAccount}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 18,
            paddingHorizontal: 0,
            width: '100%',
          }}
        >
          <Ionicons name="trash-outline" size={22} color="#ff3b30" style={{ marginRight: 14, marginLeft: 8 }} />
          <Text style={{ color: '#ff3b30', fontSize: 17, fontWeight: '400' }}>{t('deleteAccount')}</Text>
        </Pressable>
        <View style={{ height: 1, backgroundColor: '#E5E5EA', width: '100%' }} />
      </View>
    </ScrollView>
  );
} 