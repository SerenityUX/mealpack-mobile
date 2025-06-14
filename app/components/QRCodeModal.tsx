import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Modal, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface QRCodeModalProps {
  visible: boolean;
  onClose: () => void;
  recipeId: string;
  recipeName: string;
}

export default function QRCodeModal({ visible, onClose, recipeId, recipeName }: QRCodeModalProps) {
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLogoIndex, setCurrentLogoIndex] = useState(0);
  
  // Array of logo images
  const logoImages = [
    require('../../assets/images/littleGuy1.png'),
    require('../../assets/images/littleGuy2.png'),
    require('../../assets/images/littleGuy3.png'),
    require('../../assets/images/littleGuy4.png'),
    require('../../assets/images/littleGuy5.png'),
  ];
  
  useEffect(() => {
    if (visible) {
      createShareCode();
    } else {
      // Reset state when modal closes
      setShareCode(null);
      setLoading(true);
      setError(null);
      setCurrentLogoIndex(0);
    }
  }, [visible, recipeId]);
  
  // Effect to cycle through logos
  useEffect(() => {
    if (!visible || loading || error) return;
    
    const interval = setInterval(() => {
      setCurrentLogoIndex(prevIndex => (prevIndex + 1) % logoImages.length);
    }, 1000); // Change every 1 second
    
    return () => clearInterval(interval);
  }, [visible, loading, error, logoImages.length]);
  
  const createShareCode = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) {
        setError('You must be logged in to share a recipe');
        setLoading(false);
        return;
      }
      
      const response = await fetch('https://serenidad.click/mealpack/createShareCode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_token,
          recipe_id: recipeId
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create share code');
      }
      
      setShareCode(data.share_code);
    } catch (error: any) {
      setError(error.message || 'Failed to create share code');
      console.error('Error creating share code:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Create a deep link URL using the app scheme and share code
  const deepLinkUrl = shareCode ? `mealpack-mobile://claim/${shareCode}` : '';
  
  // Get the current logo
  const currentLogo = logoImages[currentLogoIndex];
  
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.container}>
          <View style={styles.modalView}>
            <View style={styles.qrContainer}>
              {loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
              ) : error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : (
                <QRCode
                  value={deepLinkUrl}
                  size={150}
                  backgroundColor="white"
                  color="black"
                  logo={currentLogo}
                  logoSize={24}
                  logoBackgroundColor="white"
                />
              )}
            </View>
            
            {/* {shareCode && (
              <Text style={styles.shareCode}>
                Code: {shareCode}
              </Text>
            )}
             */}
            <Text style={styles.description}>
              Scan to add {recipeName} to your Meal Pack
            </Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'flex-end',
    paddingTop: 109, // Position below the header
    paddingRight: 10,
  },
  modalView: {
    width: width * 0.7,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  qrContainer: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 10,
    width: 170,
    height: 170,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    color: '#333',
    marginBottom: 5,
  },
  shareCode: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 10,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
}); 