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
  Text,
  TextInput,
  View,
  StyleSheet,
} from "react-native";
import ContextMenu from "react-native-context-menu-view";
import { recipeEvents } from "../utils/events";

export default function DetailView() {
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const router = useRouter();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [androidInputVisible, setAndroidInputVisible] = useState(false);
  const [androidInput, setAndroidInput] = useState("");
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

  const handleDeleteRecipe = async () => {
    try {
      const auth_token = await AsyncStorage.getItem("auth_token");
      if (!auth_token) {
        Alert.alert("Error", "You must be logged in to delete a recipe");
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

      // Emit the deletion event
      recipeEvents.emit(currentRecipe.id);

      Alert.alert("Success", "Recipe deleted successfully", [
        {
          text: "OK",
          onPress: () => {
            // Navigate back to the previous screen
            router.back();
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to delete recipe");
    }
  };

  const handleShareRecipe = async () => {
    if (Platform.OS === "ios") {
      Alert.prompt(
        "Share Recipe",
        "Enter the email of the person you want to share with:",
        async (email) => {
          if (!email) return;
          setSharing(true);
          try {
            const auth_token = await AsyncStorage.getItem("auth_token");
            if (!auth_token) {
              Alert.alert("Error", "You must be logged in to share a recipe");
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
                  "User Not Found",
                  "No user with that email exists.",
                );
              } else if (
                data.error === "Recipe already shared with this user"
              ) {
                Alert.alert(
                  "Already Shared",
                  "You have already shared this recipe with that user.",
                );
              } else {
                Alert.alert("Error", data.error || "Failed to share recipe");
              }
              return;
            }
            Alert.alert("Success", "Recipe shared successfully!");
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to share recipe");
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

  const handleAndroidShare = async () => {
    if (!androidInput) {
      Alert.alert("Error", "Please enter an email address.");
      return;
    }
    setSharing(true);
    try {
      const auth_token = await AsyncStorage.getItem("auth_token");
      if (!auth_token) {
        Alert.alert("Error", "You must be logged in to share a recipe");
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
          Alert.alert("User Not Found", "No user with that email exists.");
        } else if (data.error === "Recipe already shared with this user") {
          Alert.alert(
            "Already Shared",
            "You have already shared this recipe with that user.",
          );
        } else {
          Alert.alert("Error", data.error || "Failed to share recipe");
        }
        return;
      }
      Alert.alert("Success", "Recipe shared successfully!");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to share recipe");
    } finally {
      setSharing(false);
      setAndroidInputVisible(false);
      setAndroidInput("");
    }
  };

  // ActionSheet handler
  const showActionSheet = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Delete", "Share"],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
          userInterfaceStyle: "light",
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            // Delete
            Alert.alert(
              "Delete Recipe",
              "Are you sure you want to delete this recipe?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: handleDeleteRecipe,
                },
              ],
            );
          } else if (buttonIndex === 2) {
            // Share
            Alert.alert("Share pressed");
          }
        },
      );
    } else {
      // Fallback for Android
      Alert.alert("Options", "", [
        {
          text: "Delete",
          onPress: () => {
            Alert.alert(
              "Delete Recipe",
              "Are you sure you want to delete this recipe?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: handleDeleteRecipe,
                },
              ],
            );
          },
          style: "destructive",
        },
        { text: "Share", onPress: () => Alert.alert("Share pressed") },
        { text: "Cancel", style: "cancel" },
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
        ...(isAuthor ? [{ title: "Edit", systemIcon: "pencil" }] : []),
        { title: "Share", systemIcon: "square.and.arrow.up" },
        { title: "Delete", systemIcon: "trash", destructive: true },
      ];
      navigation.setOptions({
        title: currentRecipe.name,
        headerRight: () => (
          <ContextMenu
            actions={actions}
            dropdownMenuMode={true}
            onPress={(e) => {
              let offset = 0;
              if (isAuthor) {
                if (e.nativeEvent.index === 0) {
                  // Edit
                  router.push({
                    pathname: "/edit",
                    params: {
                      recipe: JSON.stringify(currentRecipe),
                      recipeId: currentRecipe.id,
                      userId: userId,
                    },
                  });
                  return;
                }
                offset = 1;
              }
              if (e.nativeEvent.index === offset) {
                handleShareRecipe();
              } else if (e.nativeEvent.index === offset + 1) {
                Alert.alert(
                  "Delete Recipe",
                  "Are you sure you want to delete this recipe?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: handleDeleteRecipe,
                    },
                  ],
                );
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
  }, [navigation, currentRecipe, userId]);

  if (!currentRecipe) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>No recipe data.</Text>
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
        {currentRecipe.imageData && (
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
              source={{ uri: currentRecipe.imageData }}
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
                  currentRecipe.imageData,
                );
                setImageLoading(false);
                setImageError(true);
              }}
            />
          </View>
        )}
        <View style={{ paddingHorizontal: 20 }}>
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
                  Ingredients
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
                Directions
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
      </ScrollView>
      <Modal
        visible={androidInputVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAndroidInputVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Share Recipe</Text>
            <Text>
              Enter the email address of the person you want to share this
              recipe with:
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
                title={sharing ? "Sharing..." : "Share"}
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
