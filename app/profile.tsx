import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { recipeEvents, userProfileEvents } from '../utils/events';
import { getToken, removeToken } from '../utils/token';

export default function ProfileView() {
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const router = useRouter();
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
    navigation.setOptions({ title: 'Profile' });
  }, [navigation]);

  const handleSignOut = async () => {
    recipeEvents.emitClear();
    await removeToken();
    await AsyncStorage.removeItem('user_profile');
    router.replace('/auth');
  };

  const handleDeleteAccount = () => {
    Alert.prompt(
      'Delete Account',
      'This action cannot be undone. All your recipes and data will be permanently deleted. Type "Delete My Account" to confirm.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async (text) => {
            if (text === 'Delete My Account') {
              try {
                const token = await getToken();
                if (!token) {
                  Alert.alert('Error', 'You must be logged in to delete your account.');
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
                Alert.alert('Error', error.message || 'Failed to delete account');
              }
            } else {
              Alert.alert('Error', 'Please type "Delete My Account" exactly to confirm deletion.');
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      Alert.alert('Success', 'Profile picture updated!');
    } catch (error: any) {
      setProfilePic(user?.profile_picture_url || null);
      userProfileEvents.emit({ ...user, profile_picture_url: user?.profile_picture_url || null, name: currentName });
      Alert.alert('Error', error.message || 'Failed to upload profile picture');
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
      Alert.alert('Success', 'Name updated!');
    } catch (error: any) {
      setCurrentName(prevName);
      userProfileEvents.emit({ ...user, profile_picture_url: profilePic, name: prevName });
      Alert.alert('Error', error.message || 'Failed to update name');
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
                {needsProfile ? 'Tap to upload profile picture' : 'Upload profile picture'}
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
                placeholder={needsProfile ? 'Input Name' : ''}
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
                <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#111', marginRight: 6 }}>{needsProfile && !currentName ? 'Input Name' : currentName}</Text>
                <Ionicons name="pencil" size={20} color="#888" />
              </Pressable>
            </>
          )}
        </View>
        <Text style={{ fontSize: 18, color: '#666', marginBottom: 8 }}>{user.email}</Text>
      </View>
      {/* Divider and Actions */}
      <View style={{ width: '100%', marginTop: 0 }}>
        {/* Divider */}
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
          <Text style={{ color: '#222', fontSize: 17, fontWeight: '400' }}>Sign out</Text>
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
          <Text style={{ color: '#ff3b30', fontSize: 17, fontWeight: '400' }}>Delete Account</Text>
        </Pressable>
        <View style={{ height: 1, backgroundColor: '#E5E5EA', width: '100%' }} />
      </View>
    </ScrollView>
  );
} 