import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, Text, TextInput, View } from 'react-native';
import { createOTP, verifyOTP } from '../utils/OTPapi';

const log = (message: string, data?: any) => {
  if (__DEV__) {
    if (data) {
      console.log(`[MealPack] ${message}`, data);
    } else {
      console.log(`[MealPack] ${message}`);
    }
  }
};

const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [keySent, setKeySent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const emailInputRef = useRef<TextInput>(null);
  const codeInputRef = useRef<TextInput>(null);

  const handleEmailChange = (newEmail: string) => {
    log('Email changed:', newEmail);
    setEmail(newEmail);
    if (keySent) {
      log('Resetting state due to email change');
      setKeySent(false);
      setCode('');
    }
    setError('');
  };

  const handleSendKey = async () => {
    if (!isValidEmail(email)) return;
    
    log('Sending OTP request for email:', email);
    try {
      setLoading(true);
      setError('');
      log('Making API call to createOTP...');
      await createOTP(email);
      log('OTP created successfully');
      setKeySent(true);
      // Auto focus the code input after OTP is sent
      setTimeout(() => {
        codeInputRef.current?.focus();
      }, 100);
    } catch (error) {
      log('Error in handleSendKey:', error);
      setError('Failed to send verification key');
      Alert.alert('Error', 'Failed to send verification key');
    } finally {
      log('Finished OTP request');
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (code.length < 4) return;
    
    log('Attempting login', { email, code });
    try {
      setLoading(true);
      setError('');
      log('Making API call to verifyOTP...');
      const response = await verifyOTP(email, code);
      log('OTP verified successfully, received token');
      // Store the auth token
      log('Storing auth token in AsyncStorage...');
      await AsyncStorage.setItem('auth_token', response.auth_token);
      log('Auth token stored successfully');
      // Fetch user profile
      const profileRes = await fetch('https://serenidad.click/mealpack/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auth_token: response.auth_token }),
      });
      const profileData = await profileRes.json();
      if (profileData.user_profile) {
        await AsyncStorage.setItem('user_profile', JSON.stringify(profileData.user_profile));
      }
      // Navigate to list view
      log('Navigating to list view...');
      router.push('/list');
    } catch (error) {
      log('Error in handleLogin:', error);
      setError('Invalid verification key');
      Alert.alert('Error', 'Invalid verification key');
    } finally {
      log('Finished login attempt');
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 8 }}>Grab your Meal Pack</Text>
      <Text style={{marginBottom: 16}}>Sign up or login with your email</Text>
      
      <View style={{ 
        flexDirection: 'row', 
        width: '100%', 
        marginBottom: 10,
        alignItems: 'center'
      }}>
        <TextInput
          ref={emailInputRef}
          style={{
            flex: 1,
            height: 40,
            borderWidth: 1,
            borderColor: error ? 'red' : '#ccc',
            borderRadius: 5,
            paddingHorizontal: 10,
            marginRight: 10
          }}
          placeholder="Email"
          value={email}
          onChangeText={handleEmailChange}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
          returnKeyType="send"
          onSubmitEditing={handleSendKey}
          autoFocus
        />
        {isValidEmail(email) && (
          <Pressable
            onPress={handleSendKey}
            style={{
              backgroundColor: keySent ? '#666666' : '#000000',
              paddingHorizontal: 15,
              paddingVertical: 10,
              borderRadius: 5,
              height: 40,
              justifyContent: 'center',
              opacity: keySent || loading ? 0.7 : 1
            }}
            disabled={keySent || loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: 'white' }}>{keySent ? 'Key Sent' : 'Send Key'}</Text>
            )}
          </Pressable>
        )}
      </View>

      {error && (
        <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>
      )}

      {keySent && (
        <>
          <TextInput
            ref={codeInputRef}
            style={{
              width: '100%',
              height: 40,
              borderWidth: 1,
              borderColor: error ? 'red' : '#ccc',
              borderRadius: 5,
              paddingHorizontal: 10,
              marginBottom: 20
            }}
            placeholder="Verification Key"
            value={code}
            onChangeText={(text) => {
              log('Verification code changed:', text);
              setCode(text);
              setError('');
            }}
            keyboardType="number-pad"
            editable={!loading}
            onSubmitEditing={handleLogin}
          />

          {code.length >= 4 && (
            <Pressable 
              onPress={handleLogin}
              style={{
                backgroundColor: '#000000',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 5,
                width: '100%',
                alignItems: 'center',
                opacity: loading ? 0.7 : 1
              }}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: 'white' }}>Login</Text>
              )}
            </Pressable>
          )}
        </>
      )}

      <Text style={{ color: '#666', fontSize: 11, marginTop: 24, marginBottom: 0, textAlign: 'center', lineHeight: 18 }}>
        By continuing you agree to{' '}
        <Text
          style={{ color: '#007AFF', textDecorationLine: 'underline' }}
          onPress={() => Linking.openURL('https://serenidad.click/mealpack/tos')}
        >
          terms & conditions
        </Text>
        {' '} &amp;{' '}
        <Text
          style={{ color: '#007AFF', textDecorationLine: 'underline' }}
          onPress={() => Linking.openURL('https://serenidad.click/mealpack/pp')}
        >
          privacy policy
        </Text>
      </Text>

      <Pressable 
        onPress={() => {
          Alert.alert(
            'Continue as Guest',
            'Users will not be able to share recipes with you until you connect your email.',
            [
              {
                text: 'Cancel',
                style: 'cancel'
              },
              {
                text: 'Continue as Guest',
                onPress: async () => {
                  try {
                    setLoading(true);
                    const response = await fetch('https://serenidad.click/mealpack/createGuestAccount', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' }
                    });
                    const data = await response.json();
                    if (!response.ok) {
                      throw new Error(data.error || 'Failed to create guest account');
                    }
                    await AsyncStorage.setItem('auth_token', data.auth_token);
                    router.push('/list');
                  } catch (error: any) {
                    Alert.alert('Error', error.message || 'Failed to create guest account');
                  } finally {
                    setLoading(false);
                  }
                }
              }
            ]
          );
        }}
      >
        <Text style={{ color: '#007AFF', fontSize: 11, marginTop: 8, textAlign: 'center' }}>
          Skip signup and continue as guest
        </Text>
      </Pressable>

      <Image
        source={require('../assets/images/mascot.png')}
        style={{
          width: 320,
          height: 320,
          marginTop: 32,
          alignSelf: 'center',
        }}
        resizeMode="contain"
      />
    </View>
  );
} 