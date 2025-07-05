import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Button,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import ContextMenu from "react-native-context-menu-view";
import { recipeEvents } from "../utils/events";
import { addToMyPack, getRecipes } from '../utils/getRecipes';
import { useTranslation } from "../utils/TranslationContext";
import QRCodeModal from './components/QRCodeModal';

export default function DetailView() {
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const router = useRouter();
  const { t } = useTranslation();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [sharedBy, setSharedBy] = useState<any>(null);
  
  const [androidInputVisible, setAndroidInputVisible] = useState(false);
  const [androidInput, setAndroidInput] = useState("");
  const [userRecipes, setUserRecipes] = useState<any[]>([]);
  let recipe = null;
  if (params.recipe) {
    try {
      recipe = JSON.parse(params.recipe as string);
      console.log("Detail View - Received Recipe:", recipe);
      console.log("Detail View - Image URL:", recipe.image_url);
      console.log("Detail View - Image Data:", recipe.imageData);
      console.log("Detail View - Received userId param:", params.userId);
    } catch (error) {
      console.error("Detail View - Error parsing recipe:", error);
    }
  }

  const [currentRecipe, setCurrentRecipe] = useState(recipe);

  // Parse sharedBy info if available
  useEffect(() => {
    if (params.sharedBy) {
      try {
        const sharedByData = JSON.parse(params.sharedBy as string);
        setSharedBy(sharedByData);
      } catch (error) {
        console.error('Error parsing sharedBy data:', error);
      }
    }
  }, [params.sharedBy]);

  useEffect(() => {
    if (params.userId) {
      setUserId(params.userId.toString());
    } else {
      // fallback to AsyncStorage if not passed
      (async () => {
        const userProfileStr = await AsyncStorage.getItem("user_profile");
        if (userProfileStr) {
          try {
            const userProfile = JSON.parse(userProfileStr);
            setUserId(userProfile.id?.toString());
          } catch {}
        }
      })();
    }
  }, [params.userId]);

  // Ensure we have imageData for the recipe
  useEffect(() => {
    if (currentRecipe && !currentRecipe.imageData && currentRecipe.image_url) {
      setCurrentRecipe({
        ...currentRecipe,
        imageData: currentRecipe.image_url
      });
    }
  }, [currentRecipe]);

  useEffect(() => {
    const unsubscribe = recipeEvents.subscribe((event: any) => {
      if (
        event &&
        typeof event === "object" &&
        event.id === currentRecipe?.id
      ) {
        setCurrentRecipe({
          ...event,
          imageData: event.imageData || event.image_url || "",
        });
      }
    });
    return () => {
      unsubscribe();
    };
  }, [currentRecipe?.id]);

  useEffect(() => {
    // Fetch user's recipes for Add to Recipes logic
    (async () => {
      try {
        const data = await getRecipes();
        setUserRecipes((data.recipes || []).filter((r: any) => r && r.id));
      } catch {}
    })();
  }, []);

  // Defensive check
  const isInUserRecipes = userRecipes.some((r: any) => r && r.id === currentRecipe?.id);

  const handleDeleteRecipe = async () => {
    try {
      const auth_token = await AsyncStorage.getItem("auth_token");
      if (!auth_token) {
        Alert.alert(t("error"), "You must be logged in to delete a recipe");
        return;
      }

      const response = await fetch(
        "https://serenidad.click/mealpack/deleteRecipe",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            auth_token,
            recipe_id: currentRecipe.id,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete recipe");
      }

      // Emit the deletion event with just the ID string
      // This matches the expected format in list.tsx for deletion events
      recipeEvents.emit(currentRecipe.id.toString());

      Alert.alert(t("success"), "Recipe deleted successfully", [
        {
          text: t("ok"),
          onPress: () => {
            // Navigate back to the previous screen
            router.back();
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert(t("error"), error.message || "Failed to delete recipe");
    }
  };

  const handleShareByEmail = async () => {
    if (Platform.OS === "ios") {
      Alert.prompt(
        t("shareRecipeByEmail"),
        t("enterEmailToShare"),
        async (email) => {
          if (!email) return;
          setSharing(true);
          try {
            const auth_token = await AsyncStorage.getItem("auth_token");
            if (!auth_token) {
              Alert.alert(t("error"), "You must be logged in to share a recipe");
              return;
            }
            const response = await fetch(
              "https://serenidad.click/mealpack/shareRecipe",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  auth_token,
                  recipe_id: currentRecipe.id,
                  email,
                }),
              },
            );
            const data = await response.json();
            if (!response.ok) {
              if (data.error === "User with provided email not found") {
                Alert.alert(
                  t("userNotFound"),
                  t("userNotFound"),
                );
              } else if (
                data.error === "Recipe already shared with this user"
              ) {
                Alert.alert(
                  t("alreadyShared"),
                  t("alreadyShared"),
                );
              } else {
                Alert.alert(t("error"), data.error || "Failed to share recipe");
              }
              return;
            }
            Alert.alert(t("success"), t("recipeSharedSuccess"));
          } catch (error: any) {
            Alert.alert(t("error"), error.message || "Failed to share recipe");
          } finally {
            setSharing(false);
          }
        },
        "plain-text",
      );
    } else {
      // Android: Show custom modal for input
      setAndroidInputVisible(true);
    }
  };
  
  const handleShareRecipe = async () => {
    setSharing(true);
    try {
      const auth_token = await AsyncStorage.getItem("auth_token");
      if (!auth_token) {
        Alert.alert(t("error"), "You must be logged in to share a recipe");
        return;
      }
      
      const response = await fetch(
        "https://serenidad.click/mealpack/createShareLink",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auth_token,
            recipe_id: currentRecipe.id,
          }),
        },
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to create share link");
      }
      
      // Use native share functionality
      if (Platform.OS === "ios" || Platform.OS === "android") {
        await Share.share({
          message: `Check out this recipe: ${currentRecipe.name}`,
          url: data.share_link,
        });
      } else {
        Alert.alert("Share Link", data.share_link);
      }
    } catch (error: any) {
      Alert.alert(t("error"), error.message || "Failed to share recipe");
    } finally {
      setSharing(false);
    }
  };

  const handleAndroidShare = async () => {
    if (!androidInput) {
      Alert.alert(t("error"), "Please enter an email address.");
      return;
    }
    setSharing(true);
    try {
      const auth_token = await AsyncStorage.getItem("auth_token");
      if (!auth_token) {
        Alert.alert(t("error"), "You must be logged in to share a recipe");
        return;
      }
      const response = await fetch(
        "https://serenidad.click/mealpack/shareRecipe",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auth_token,
            recipe_id: currentRecipe.id,
            email: androidInput,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        if (data.error === "User with provided email not found") {
          Alert.alert(t("userNotFound"), t("userNotFound"));
        } else if (data.error === "Recipe already shared with this user") {
          Alert.alert(
            t("alreadyShared"),
            t("alreadyShared"),
          );
        } else {
          Alert.alert(t("error"), data.error || "Failed to share recipe");
        }
        return;
      }
      Alert.alert(t("success"), t("recipeSharedSuccess"));
    } catch (error: any) {
      Alert.alert(t("error"), error.message || "Failed to share recipe");
    } finally {
      setSharing(false);
      setAndroidInputVisible(false);
      setAndroidInput("");
    }
  };

  const handleAddToMyPack = async () => {
    try {
      await addToMyPack(currentRecipe.id);
      // Re-fetch recipes to update state and menu
      const data = await getRecipes();
      setUserRecipes((data.recipes || []).filter((r: any) => r && r.id));
      // Emit event with the new recipe object for list update
      const newRecipe = (data.recipes || []).find((r: any) => r && r.id === currentRecipe.id);
      if (newRecipe) recipeEvents.emit(newRecipe);
      Alert.alert(t('success'), 'Recipe added to your recipes!');
    } catch (error: any) {
      Alert.alert(t('error'), error.message || 'Failed to add recipe');
    }
  };

  // ActionSheet handler
  const showActionSheet = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [t("cancel"), t("delete"), t("share")],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
          userInterfaceStyle: "light",
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            // Delete
            Alert.alert(
              t("deleteRecipe"),
              t("deleteRecipeConfirm"),
              [
                { text: t("cancel"), style: "cancel" },
                {
                  text: t("delete"),
                  style: "destructive",
                  onPress: handleDeleteRecipe,
                },
              ],
            );
          } else if (buttonIndex === 2) {
            // Share
            Alert.alert(t("share"));
          }
        },
      );
    } else {
      // Fallback for Android
      Alert.alert(t("options"), "", [
        {
          text: t("delete"),
          onPress: () => {
            Alert.alert(
              t("deleteRecipe"),
              t("deleteRecipeConfirm"),
              [
                { text: t("cancel"), style: "cancel" },
                {
                  text: t("delete"),
                  style: "destructive",
                  onPress: handleDeleteRecipe,
                },
              ],
            );
          },
          style: "destructive",
        },
        { text: t("share"), onPress: () => Alert.alert(t("share")) },
        { text: t("cancel"), style: "cancel" },
      ]);
    }
  };

  useLayoutEffect(() => {
    if (currentRecipe && currentRecipe.name) {
      // Determine if user is author
      const isAuthor =
        userId &&
        currentRecipe.author &&
        (userId === currentRecipe.author.id?.toString() ||
          userId === currentRecipe.recipe_author?.toString());
      console.log(
        "Detail View - userId:",
        userId,
        "recipe.author.id:",
        currentRecipe.author?.id,
        "recipe.recipe_author:",
        currentRecipe.recipe_author,
        "isAuthor:",
        isAuthor,
      );
      const actions = [
        // Only show Add to Recipes if not in user's recipes
        ...(!isInUserRecipes ? [{ title: 'Add to Recipes', systemIcon: 'plus' }] : []),
        // Only show share options if in user's recipes
        ...(isInUserRecipes ? [
          { title: t('share'), systemIcon: 'square.and.arrow.up' },
          { title: t('shareByEmail'), systemIcon: 'envelope' },
          { title: t('qrCode'), systemIcon: 'qrcode' },
          { title: t('delete'), systemIcon: 'trash', destructive: true },
        ] : []),
      ];
      navigation.setOptions({
        title: currentRecipe.name,
        headerRight: () => (
          <ContextMenu
            actions={actions}
            dropdownMenuMode={true}
            onPress={(e) => {
              let offset = 0;
              if (!isInUserRecipes && e.nativeEvent.index === 0) {
                handleAddToMyPack();
                return;
              }
              if (!isInUserRecipes) offset = 1;
              if (isInUserRecipes) {
                if (e.nativeEvent.index === offset) {
                  handleShareRecipe();
                } else if (e.nativeEvent.index === offset + 1) {
                  handleShareByEmail();
                } else if (e.nativeEvent.index === offset + 2) {
                  setQrModalVisible(true);
                } else if (e.nativeEvent.index === offset + 3) {
                  Alert.alert(
                    t('deleteRecipe'),
                    t('deleteRecipeConfirm'),
                    [
                      { text: t('cancel'), style: 'cancel' },
                      {
                        text: t('delete'),
                        style: 'destructive',
                        onPress: handleDeleteRecipe,
                      },
                    ],
                  );
                }
              }
            }}
          >
            <Pressable hitSlop={10} style={{ paddingHorizontal: 10 }}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#222" />
            </Pressable>
          </ContextMenu>
        ),
      });
    }
  }, [navigation, currentRecipe, userId, t, isInUserRecipes]);

  if (!currentRecipe) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>{t("noRecipeData")}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Recipe Image */}
        {(currentRecipe?.imageData || currentRecipe?.image_url) && (
          <View
            style={{
              width: "100%",
              aspectRatio: 3 / 4,
              borderRadius: 0,
              overflow: "hidden",
              marginBottom: 16,
            }}
          >
            <Image
              source={{ uri: currentRecipe.imageData || currentRecipe.image_url }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
              onLoad={() => {
                console.log("Detail View - Image loaded successfully");
                setImageLoading(false);
              }}
              onError={(error) => {
                console.error(
                  "Detail View - Image load error:",
                  error.nativeEvent.error,
                );
                console.error(
                  "Detail View - Failed URL:",
                  currentRecipe.imageData || currentRecipe.image_url,
                );
                setImageLoading(false);
                setImageError(true);
              }}
            />
          </View>
        )}
        <View style={{ paddingHorizontal: 20 }}>
        {/* Shared By Info - Show this if the recipe was shared */}
        {sharedBy && (
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            marginBottom: 16,
            backgroundColor: '#f0f8ff',
            padding: 12,
            borderRadius: 8
          }}>
            {sharedBy.profile_picture && (
              <Image
                source={{ uri: sharedBy.profile_picture }}
                style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
              />
            )}
            <Text style={{ fontSize: 15, flex: 1 }}>
              <Text style={{ fontWeight: 'bold' }}>{sharedBy.name}</Text> {t("sharedByUser")}
            </Text>
          </View>
        )}
        
          {/* Description */}
          {currentRecipe.description && (
            <Text style={{ fontSize: 18, lineHeight: 26, marginBottom: 16 }}>
              {currentRecipe.description}
            </Text>
          )}
        
          {/* Author */}
          {currentRecipe.author && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 22,
              }}
            >
              {currentRecipe.author.profile_picture && (
                <Image
                  source={{ uri: currentRecipe.author.profile_picture }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    marginRight: 12,
                  }}
                />
              )}
              <Text style={{ fontSize: 17 }}>{currentRecipe.author.name}</Text>
            </View>
          )}
        
          {/* Ingredients */}
          {currentRecipe.ingredients &&
            currentRecipe.ingredients.length > 0 && (
              <View style={{ marginBottom: 22 }}>
                <Text
                  style={{ fontWeight: "bold", fontSize: 17, marginBottom: 8 }}
                >
                  {t("ingredients")}
                </Text>
                {currentRecipe.ingredients.map((item: any, idx: number) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      marginBottom: 4,
                    }}
                  >
                    <Text
                      style={{ marginRight: 8, fontSize: 18, lineHeight: 26 }}
                    >
                      •
                    </Text>
                    <Text style={{ flex: 1, fontSize: 17, lineHeight: 26 }}>
                      {item.text || item}
                    </Text>
                  </View>
                ))}
              </View>
            )}
        
          {/* Directions */}
          {currentRecipe.directions && currentRecipe.directions.length > 0 && (
            <View style={{ marginBottom: 22 }}>
              <Text
                style={{ fontWeight: "bold", fontSize: 17, marginBottom: 8 }}
              >
                {t("directions")}
              </Text>
              {currentRecipe.directions.map((item: any, idx: number) => (
                <View
                  key={idx}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    marginBottom: 4,
                  }}
                >
                  <Text
                    style={{ marginRight: 8, fontSize: 18, lineHeight: 26 }}
                  >
                    {idx + 1}.
                  </Text>
                  <Text style={{ flex: 1, fontSize: 17, lineHeight: 26 }}>
                    {item.text || item}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

      {/* QR Code Modal */}
      <QRCodeModal
        visible={qrModalVisible}
        onClose={() => setQrModalVisible(false)}
        recipeId={currentRecipe.id}
        recipeName={currentRecipe.name}
      />
      </ScrollView>
      <Modal
        visible={androidInputVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAndroidInputVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>{t("shareRecipeByEmail")}</Text>
            <Text>
              {t("enterEmailToShare")}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email address"
              value={androidInput}
              onChangeText={setAndroidInput}
              keyboardType="email-address"
            />
            <View style={styles.buttonContainer}>
              <Button
                title={sharing ? t("loading") : t("share")}
                onPress={handleAndroidShare}
                disabled={sharing}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%", // Wider modal for Android
    padding: 24, // Increased padding for better spacing
    backgroundColor: "white",
    borderRadius: 8, // Rounded corners
    elevation: 4, // Subtle shadow for Android
  },
  title: {
    fontSize: 20, // Larger font size for title
    fontWeight: "600", // Semi-bold for better readability
    marginBottom: 16, // Increased spacing
    color: "#333", // Darker text color
  },
  input: {
    marginTop: 8, // Spacing above input
    borderWidth: 1,
    borderColor: "#ddd", // Lighter border color
    borderRadius: 4, // Slightly rounded corners
    padding: 12, // Increased padding for input
    marginBottom: 24, // Increased spacing
    fontSize: 16, // Larger font size for input
    color: "#333", // Darker text color
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 0, // Added spacing above buttons
  },
});
