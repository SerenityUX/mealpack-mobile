import { ExpoContextMenuProvider } from "@appandflow/expo-context-menu";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { getToken } from "../utils/token";
import { TranslationProvider } from "../utils/TranslationContext";

type RootStackParamList = {
  "book/[id]": { book?: string };
};

export default function Layout() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getToken();
      const inAuthGroup = segments[0] === "auth";

      if (!token && !inAuthGroup) {
        // Redirect to auth if no token and not already in auth
        router.replace("/auth");
      } else if (token && inAuthGroup) {
        // Redirect to tabs if has token and in auth
        router.replace("/(tabs)/list");
      }
    };

    checkAuth();
  }, [segments]);

  return (
    <>
      <StatusBar style="dark" />
      <TranslationProvider>
        <ExpoContextMenuProvider>
          <Stack>
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="detail"
              options={{
                headerShown: true,
                title: "Item Details",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="create"
              options={{
                headerShown: true,
                title: "Create New Item",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="edit"
              options={{
                headerShown: true,
                title: "Edit Item",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="generate"
              options={{
                headerShown: true,
                title: "Generate Item",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="profile"
              options={{
                headerShown: true,
                title: "Profile",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="claim/[code]"
              options={{
                headerShown: true,
                title: "Claim Recipe",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="claim/index"
              options={{
                headerShown: true,
                title: "Claim Recipe",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="recipe/[id]"
              options={{
                headerShown: true,
                title: "Recipe",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="book/[id]"
              options={({ route }) => {
                const params = route.params as RootStackParamList["book/[id]"];
                const bookData = params?.book ? JSON.parse(params.book) : null;
                return {
                  headerShown: true,
                  title: bookData?.name || "Book",
                  headerBackTitle: "Back",
                };
              }}
            />
          </Stack>
        </ExpoContextMenuProvider>
      </TranslationProvider>
    </>
  );
}
