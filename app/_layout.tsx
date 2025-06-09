import { ExpoContextMenuProvider } from "@appandflow/expo-context-menu";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { getToken } from "../utils/token";
import { StatusBar } from "expo-status-bar";

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
        // Redirect to list if has token and in auth
        router.replace("/list");
      }
    };

    checkAuth();
  }, [segments]);

  return (
    <>
      <StatusBar style="dark" />
      <ExpoContextMenuProvider>
        <Stack>
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="list" options={{ headerShown: false }} />
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
        </Stack>
      </ExpoContextMenuProvider>
    </>
  );
}
