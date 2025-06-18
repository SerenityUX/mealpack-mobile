import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { getToken } from "../utils/token";
import { uploadFile } from "../utils/uploadFile";

export default function GenerateView() {
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
  const [generationStatus, setGenerationStatus] = useState("");
  const [editRequest, setEditRequest] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isLittleGuy2, setIsLittleGuy2] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // Generation progress states
  const [nameGenerated, setNameGenerated] = useState(false);
  const [descriptionGenerated, setDescriptionGenerated] = useState(false);
  const [ingredientsGenerated, setIngredientsGenerated] = useState(false);
  const [directionsGenerated, setDirectionsGenerated] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [generationError, setGenerationError] = useState("");

  // Create refs for the last input in each list
  const lastIngredientRef = useRef<TextInput>(null);
  const lastDirectionRef = useRef<TextInput>(null);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      
      // Clear any animation timeout when component unmounts
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

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
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 1,
      });
      console.log('ImagePicker result:', result);
      if (!result.canceled) {
        // Reset all generation states when a new image is selected
        resetGenerationStates();
        
        setSelectedImage(result.assets[0].uri);
        setLoading(true);
        setUploadProgress(0);
        
        try {
          const uploadedUrl = await uploadFile(result.assets[0].uri, (progress) => {
            setUploadProgress(progress);
          });
          setImageUrl(uploadedUrl);
          console.log('Uploaded image URL:', uploadedUrl);
          
          // Start recipe generation after image upload
          generateRecipe(result.assets[0].uri);
        } catch (error) {
          console.error('Error uploading image:', error);
          alert('Failed to upload image. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('ImagePicker error:', error);
      alert('Image picker crashed: ' + error);
    }
  };
  
  const resetGenerationStates = () => {
    setRecipeName("");
    setRecipeDescription("");
    setIngredients([""]);
    setDirections([""]);
    setNameGenerated(false);
    setDescriptionGenerated(false);
    setIngredientsGenerated(false);
    setDirectionsGenerated(false);
    setGenerationComplete(false);
    setGenerationError("");
    setGenerationStatus("");
  };
  
  const generateRecipe = async (imageUri: string) => {
    try {
      setCreateLoading(true);
      
      // Create form data with the image
      const formData = new FormData();
      // @ts-ignore - TypeScript doesn't like the type here but it works
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'recipe-image.jpg',
      });
      
      const token = await getToken();
      if (!token) {
        alert("Please log in to generate a recipe");
        setCreateLoading(false);
        return;
      }

      // Use XMLHttpRequest which has better support for SSE
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://serenidad.click/mealpack/generateRecipe');
      xhr.setRequestHeader('Content-Type', 'multipart/form-data');
      
      // Set up event handlers
      let buffer = '';
      
      xhr.onprogress = (event) => {
        // Get the new chunk of data
        const newData = xhr.responseText.substring(buffer.length);
        buffer += newData;
        
        // Process events in the buffer
        const lines = buffer.split("\n\n");
        
        // Keep the last (potentially incomplete) chunk in the buffer
        if (!newData.endsWith("\n\n")) {
          buffer = lines.pop() || "";
        } else {
          buffer = "";
        }
        
        // Process each complete event
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const eventData = JSON.parse(line.substring(6));
              console.log("Received event:", eventData);
              
              if (eventData.error) {
                setGenerationError(eventData.error);
                continue;
              }
              
              // Update UI based on generation progress
              if (eventData.status === "processing") {
                // Processing image
              } else if (eventData.status === "name_generated") {
                setRecipeName(eventData.recipe.recipe_name);
                setNameGenerated(true);
              } else if (eventData.status === "description_generated") {
                setRecipeDescription(eventData.recipe.recipe_description);
                setDescriptionGenerated(true);
              } else if (eventData.status === "ingredients_generated") {
                setIngredients(eventData.recipe.ingredients);
                setIngredientsGenerated(true);
              } else if (eventData.status === "directions_generated") {
                setDirections(eventData.recipe.directions);
                setDirectionsGenerated(true);
              } else if (eventData.status === "completed") {
                setGenerationComplete(true);
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e, "Raw data:", line);
            }
          }
        }
      };
      
      xhr.onerror = (error) => {
        console.error("XHR Error:", error);
        setGenerationError("Network error while generating recipe");
        setCreateLoading(false);
      };
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Request completed successfully
          console.log("Recipe generation completed");
        } else {
          // Request failed
          setGenerationError(`HTTP error ${xhr.status}`);
        }
        setCreateLoading(false);
      };
      
      // Send the request
      xhr.send(formData);
    } catch (error) {
      console.error("Error generating recipe:", error);
      setGenerationError(error instanceof Error ? error.message : "Failed to generate recipe");
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

  // Handle edit request submission
  const handleEditRequest = async () => {
    if (editRequest.trim() === '' || isRegenerating) return;
    
    try {
      // Set regenerating state to true to prevent multiple requests
      setIsRegenerating(true);
      
      // Create the current recipe object
      const currentRecipe = {
        recipe_name: recipeName,
        recipe_description: recipeDescription,
        ingredients: ingredients.filter(i => i.trim() !== ""),
        directions: directions.filter(d => d.trim() !== ""),
        image_url: imageUrl
      };
      
      // Clear the input field
      setEditRequest('');
      
      // Dismiss keyboard
      Keyboard.dismiss();
      
      // Reset regeneration states but keep the current values
      setNameGenerated(false);
      setDescriptionGenerated(false);
      setIngredientsGenerated(false);
      setDirectionsGenerated(false);
      setGenerationComplete(false);
      
      console.log('Sending regeneration request with prompt:', editRequest);
      
      // Use XMLHttpRequest for SSE support
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://serenidad.click/mealpack/regenerateRecipe');
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      // Set up event handlers
      let buffer = '';
      
      xhr.onprogress = (event) => {
        // Get the new chunk of data
        const newData = xhr.responseText.substring(buffer.length);
        buffer += newData;
        
        // Process events in the buffer
        const lines = buffer.split("\n\n");
        
        // Keep the last (potentially incomplete) chunk in the buffer
        if (!newData.endsWith("\n\n")) {
          buffer = lines.pop() || "";
        } else {
          buffer = "";
        }
        
        // Process each complete event
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const eventData = JSON.parse(line.substring(6));
              console.log("Received regeneration event:", eventData);
              
              if (eventData.error) {
                setGenerationError(eventData.error);
                continue;
              }
              
              // Update UI based on regeneration progress
              if (eventData.status === "processing") {
                // Processing request
              } else if (eventData.status === "name_regenerated") {
                setRecipeName(eventData.recipe.recipe_name);
                setNameGenerated(true);
              } else if (eventData.status === "description_regenerated") {
                setRecipeDescription(eventData.recipe.recipe_description);
                setDescriptionGenerated(true);
              } else if (eventData.status === "ingredients_regenerated") {
                setIngredients(eventData.recipe.ingredients);
                setIngredientsGenerated(true);
              } else if (eventData.status === "directions_regenerated") {
                setDirections(eventData.recipe.directions);
                setDirectionsGenerated(true);
              } else if (eventData.status === "completed") {
                setGenerationComplete(true);
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e, "Raw data:", line);
            }
          }
        }
      };
      
      xhr.onerror = (error) => {
        console.error("XHR Error during regeneration:", error);
        setGenerationError("Network error while regenerating recipe");
        setIsRegenerating(false);
      };
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Request completed successfully
          console.log("Recipe regeneration completed");
        } else {
          // Request failed
          setGenerationError(`HTTP error ${xhr.status}`);
        }
        setIsRegenerating(false);
      };
      
      // Send the request with recipe and prompt
      xhr.send(JSON.stringify({
        recipe: currentRecipe,
        prompt: editRequest
      }));
    } catch (error) {
      console.error("Error regenerating recipe:", error);
      setGenerationError(error instanceof Error ? error.message : "Failed to regenerate recipe");
      setIsRegenerating(false);
    }
  };

  // Handle text change with animation
  const handleTextChange = (text: string) => {
    setEditRequest(text);
    
    // Clear any existing timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    
    // Change to littleGuy2
    setIsLittleGuy2(true);
    
    // Change back to littleGuy1 after 1 second
    animationTimeoutRef.current = setTimeout(() => {
      setIsLittleGuy2(false);
      animationTimeoutRef.current = null;
    }, 1000);
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 90 }}>
          <TextInput
            style={{
              width: "100%",
              height: 40,
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 5,
              paddingHorizontal: 10,
              marginBottom: 10,
              backgroundColor: nameGenerated ? "#ffffff" : "#f0f0f0",
            }}
            placeholder="Recipe Name"
            placeholderTextColor="#666"
            value={recipeName}
            onChangeText={setRecipeName}
            editable={nameGenerated && !isRegenerating}
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
              {createLoading && (
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.3)",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <ActivityIndicator size="large" color="#ffffff" />
                  <Text style={{ color: "white", marginTop: 10 }}>
                    Generating recipe...
                  </Text>
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
            <Text style={{ color: "#666" }}>Select Food Image</Text>
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
            backgroundColor: descriptionGenerated ? "#ffffff" : "#f0f0f0",
          }}
          placeholder="Recipe Description"
          placeholderTextColor="#666"
          value={recipeDescription}
          onChangeText={setRecipeDescription}
          multiline
          numberOfLines={4}
          editable={descriptionGenerated && !isRegenerating}
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
                backgroundColor: ingredientsGenerated ? "#ffffff" : "#f0f0f0",
              }}
              placeholder="Add ingredient"
              placeholderTextColor="#666"
              value={ingredient}
              onChangeText={(value) => updateIngredient(index, value)}
              editable={ingredientsGenerated && !isRegenerating}
            />
            {ingredientsGenerated && !isRegenerating && (
              <Pressable
                onPress={() => removeIngredient(index)}
                style={{ marginLeft: 10, padding: 5 }}
              >
                <Ionicons name="trash-outline" size={20} color="#666" />
              </Pressable>
            )}
          </View>
        ))}
        {ingredientsGenerated && !isRegenerating && (
          <Pressable onPress={addNewIngredient} style={{ marginBottom: 20 }}>
            <Text style={{ color: "#000000" }}>+ Add new ingredient</Text>
          </Pressable>
        )}

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
                backgroundColor: directionsGenerated ? "#ffffff" : "#f0f0f0",
              }}
              placeholder="Add direction"
              placeholderTextColor="#666"
              value={direction}
              onChangeText={(value) => updateDirection(index, value)}
              editable={directionsGenerated && !isRegenerating}
            />
            {directionsGenerated && !isRegenerating && (
              <Pressable
                onPress={() => removeDirection(index)}
                style={{ marginLeft: 10, padding: 5 }}
              >
                <Ionicons name="trash-outline" size={20} color="#666" />
              </Pressable>
            )}
          </View>
        ))}
        {directionsGenerated && !isRegenerating && (
          <Pressable onPress={addNewDirection} style={{ marginBottom: 20 }}>
            <Text style={{ color: "#000000" }}>+ Add new direction</Text>
          </Pressable>
        )}

        <Pressable
          onPress={handleCreate}
          style={{
            backgroundColor: "#000000",
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 5,
            width: "100%",
            alignItems: "center",
            opacity: loading || !isFormValid() || createLoading || isRegenerating ? 0.7 : 1,
            marginTop: 20,
            marginBottom: 10,
          }}
          disabled={loading || !isFormValid() || createLoading || isRegenerating}
        >
          <Text style={{ color: "white" }}>Save Recipe</Text>
        </Pressable>
        
        {generationError && (
          <Text style={{
            color: 'red',
            textAlign: 'center',
            marginVertical: 10,
          }}>
            {generationError}
          </Text>
        )}
        
        {loading && (
          <Text
            style={{
              textAlign: "center",
              color: "#666",
              marginBottom: 40,
              fontSize: 12,
            }}
          >
            Uploading image...
          </Text>
        )}
      </ScrollView>
      
      {generationComplete && (
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 80,
          backgroundColor: '#fff',
          width: '100%',
          borderTopWidth: 1,
          borderTopColor: '#ccc',
          paddingHorizontal: 20,
          paddingBottom: 14,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <Image 
            source={isLittleGuy2 ? require('../assets/images/littleGuy2.png') : require('../assets/images/littleGuy1.png')}
            style={{
              width: 40, 
              borderRadius: 8,
              height: 40,
              padding: 8,
              backgroundColor: "#FF8C0B",
              marginRight: 10,
              opacity: isRegenerating ? 0.5 : 1
            }}
          />
          <View style={{ 
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            backgroundColor: isRegenerating ? '#f0f0f0' : '#ffffff',
            paddingHorizontal: 10,
            height: 40,
          }}>
            <TextInput
              style={{
                flex: 1,
                height: 40,
                paddingVertical: 8,
                color: isRegenerating ? '#999' : '#000',
              }}
              placeholder={isRegenerating ? "Regenerating recipe..." : "Request an edit"}
              placeholderTextColor={isRegenerating ? '#999' : '#666'}
              keyboardAppearance="light"
              value={editRequest}
              onChangeText={handleTextChange}
              returnKeyType="send"
              onSubmitEditing={handleEditRequest}
              editable={!isRegenerating}
            />
            {editRequest.trim() !== '' && !isRegenerating && (
              <Pressable 
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: '#007AFF',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginLeft: 0,
                }}
                onPress={handleEditRequest}
                disabled={isRegenerating}
              >
                <Ionicons name="arrow-up" size={18} color="#fff" />
              </Pressable>
            )}
            {isRegenerating && (
              <ActivityIndicator size="small" color="#007AFF" style={{ marginLeft: 5 }} />
            )}
          </View>
        </View>
      )}
    </View>
  </KeyboardAvoidingView>
  );
}