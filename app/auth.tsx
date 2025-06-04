import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
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
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Grab your Meal Pack</Text>
      
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
    </View>
  );
} 