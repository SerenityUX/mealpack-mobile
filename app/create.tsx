import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { getToken } from "../utils/token";
import { uploadFile } from "../utils/uploadFile";

export default function CreateView() {
  const router = useRouter();
  const [recipeName, setRecipeName] = useState("");
  const [recipeDescription, setRecipeDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [directions, setDirections] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [createLoading, setCreateLoading] = useState(false);

  // Create refs for the last input in each list
  const lastIngredientRef = useRef<TextInput>(null);
  const lastDirectionRef = useRef<TextInput>(null);

  const isFormValid = () => {
    const hasValidIngredients = ingredients.some((i) => i.trim() !== "");
    const hasValidDirections = directions.some((d) => d.trim() !== "");
    return (
      recipeName.trim() !== "" &&
      recipeDescription.trim() !== "" &&
      imageUrl !== "" &&
      hasValidIngredients &&
      hasValidDirections
    );
  };

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions to make this work!");
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setLoading(true);
      setUploadProgress(0);

      try {
        const uploadedUrl = await uploadFile(
          result.assets[0].uri,
          (progress) => {
            setUploadProgress(progress);
          },
        );
        setImageUrl(uploadedUrl);
        console.log("Uploaded image URL:", uploadedUrl);
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Failed to upload image. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCreate = async () => {
    try {
      setCreateLoading(true);
      const token = await getToken();
      if (!token) {
        alert("Please log in to create a recipe");
        return;
      }

      // Filter out empty strings before submitting
      const filteredIngredients = ingredients.filter((i) => i.trim());
      const filteredDirections = directions.filter((d) => d.trim());

      const response = await fetch(
        "https://serenidad.click/mealpack/createRecipe",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            auth_token: token,
            recipe_name: recipeName,
            image_url: imageUrl,
            recipe_description: recipeDescription,
            ingredients: filteredIngredients,
            directions: filteredDirections,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create recipe");
      }

      const data = await response.json();

      // Navigate back to list view with the new recipe
      router.push({
        pathname: "/list",
        params: { newRecipe: JSON.stringify(data.recipe) },
      });
    } catch (error) {
      console.error("Error creating recipe:", error);
      alert(error instanceof Error ? error.message : "Failed to create recipe");
    } finally {
      setCreateLoading(false);
    }
  };

  const updateIngredient = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const updateDirection = (index: number, value: string) => {
    const newDirections = [...directions];
    newDirections[index] = value;
    setDirections(newDirections);
  };

  const removeIngredient = (index: number) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    if (newIngredients.length === 0) {
      newIngredients.push("");
    }
    setIngredients(newIngredients);
  };

  const removeDirection = (index: number) => {
    const newDirections = directions.filter((_, i) => i !== index);
    if (newDirections.length === 0) {
      newDirections.push("");
    }
    setDirections(newDirections);
  };

  const addNewIngredient = () => {
    setIngredients([...ingredients, ""]);
    // Focus the new input after it's rendered
    setTimeout(() => {
      lastIngredientRef.current?.focus();
    }, 100);
  };

  const addNewDirection = () => {
    setDirections([...directions, ""]);
    // Focus the new input after it's rendered
    setTimeout(() => {
      lastDirectionRef.current?.focus();
    }, 100);
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      <TextInput
        style={{
          width: "100%",
          height: 40,
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 5,
          paddingHorizontal: 10,
          marginBottom: 10,
        }}
        placeholder="Recipe Name"
        placeholderTextColor="#666"
        value={recipeName}
        onChangeText={setRecipeName}
      />

      {selectedImage ? (
        <Pressable
          onPress={pickImage}
          style={{ marginBottom: 20 }}
          disabled={loading}
        >
          <View
            style={{
              width: "100%",
              aspectRatio: 3 / 4,
              borderRadius: 5,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: "#ccc",
            }}
          >
            <Image
              source={{ uri: selectedImage }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
            {loading && (
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  padding: 10,
                }}
              >
                <Text style={{ color: "white", textAlign: "center" }}>
                  Uploading
                </Text>
                <View
                  style={{
                    height: 4,
                    backgroundColor: "#fff",
                    width: `${uploadProgress}%`,
                    marginTop: 5,
                  }}
                />
              </View>
            )}
          </View>
        </Pressable>
      ) : (
        <Pressable
          onPress={pickImage}
          style={{
            width: "100%",
            aspectRatio: 3 / 4,
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 5,
            marginBottom: 20,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#666" }}>Recipe Image</Text>
        </Pressable>
      )}

      <TextInput
        style={{
          width: "100%",
          minHeight: 100,
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 5,
          paddingHorizontal: 10,
          paddingTop: 10,
          marginBottom: 10,
          textAlignVertical: "top",
        }}
        placeholder="Recipe Description"
        placeholderTextColor="#666"
        value={recipeDescription}
        onChangeText={setRecipeDescription}
        multiline
        numberOfLines={4}
      />

      {/* Ingredients Section */}
      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
        Ingredients
      </Text>
      {ingredients.map((ingredient, index) => (
        <View
          key={index}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <Text style={{ marginRight: 10, fontSize: 16 }}>•</Text>
          <TextInput
            ref={index === ingredients.length - 1 ? lastIngredientRef : null}
            style={{
              flex: 1,
              height: 40,
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 5,
              paddingHorizontal: 10,
            }}
            placeholder="Add ingredient"
            placeholderTextColor="#666"
            value={ingredient}
            onChangeText={(value) => updateIngredient(index, value)}
          />
          <Pressable
            onPress={() => removeIngredient(index)}
            style={{ marginLeft: 10, padding: 5 }}
          >
            <Ionicons name="trash-outline" size={20} color="#666" />
          </Pressable>
        </View>
      ))}
      <Pressable onPress={addNewIngredient} style={{ marginBottom: 20 }}>
        <Text style={{ color: "#000000" }}>+ Add new ingredient</Text>
      </Pressable>

      {/* Directions Section */}
      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
        Directions
      </Text>
      {directions.map((direction, index) => (
        <View
          key={index}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <Text style={{ marginRight: 10, fontSize: 16 }}>{index + 1}.</Text>
          <TextInput
            ref={index === directions.length - 1 ? lastDirectionRef : null}
            style={{
              flex: 1,
              height: 40,
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 5,
              paddingHorizontal: 10,
            }}
            placeholder="Add direction"
            placeholderTextColor="#666"
            value={direction}
            onChangeText={(value) => updateDirection(index, value)}
          />
          <Pressable
            onPress={() => removeDirection(index)}
            style={{ marginLeft: 10, padding: 5 }}
          >
            <Ionicons name="trash-outline" size={20} color="#666" />
          </Pressable>
        </View>
      ))}
      <Pressable onPress={addNewDirection} style={{ marginBottom: 20 }}>
        <Text style={{ color: "#000000" }}>+ Add new direction</Text>
      </Pressable>

      <Pressable
        onPress={handleCreate}
        style={{
          backgroundColor: "#000000",
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderRadius: 5,
          width: "100%",
          alignItems: "center",
          opacity: loading || !isFormValid() || createLoading ? 0.7 : 1,
          marginTop: 20,
          marginBottom: 10,
        }}
        disabled={loading || !isFormValid() || createLoading}
      >
        <Text style={{ color: "white" }}>Create</Text>
      </Pressable>
      {loading && (
        <Text
          style={{
            textAlign: "center",
            color: "#666",
            marginBottom: 40,
            fontSize: 12,
          }}
        >
          Awaiting image upload to be able to create recipe
        </Text>
      )}
      {createLoading && (
        <Text
          style={{
            textAlign: "center",
            color: "#666",
            marginBottom: 40,
            fontSize: 12,
          }}
        >
          Creating recipe...
        </Text>
      )}
    </ScrollView>
  );
}
