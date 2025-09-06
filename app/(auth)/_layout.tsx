import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, router } from "expo-router";
import { useEffect } from "react";

export default function AuthLayout() {
  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        // Redirect to the main app
        router.replace("/(tabs)");
      }
    };
    checkAuth();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
