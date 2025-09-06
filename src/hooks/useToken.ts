import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";

const useToken = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Load token on component mount
    getToken();
  }, []);

  const getToken = async () => {
    try {
      const tokenString = await AsyncStorage.getItem("token");
      if (tokenString) {
        setToken(JSON.parse(tokenString));
      }
    } catch (error) {
      console.error("Error retrieving token:", error);
    }
  };

  const saveToken = async (userToken: string, userId: string) => {
    try {
      await AsyncStorage.setItem("token", JSON.stringify(userToken));
      await AsyncStorage.setItem("userId", JSON.stringify(userId));
      setToken(userToken);
      router.replace("/");
    } catch (error) {
      console.error("Error saving token:", error);
    }
  };

  const removeToken = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("userId");
      setToken(null);
      router.replace("/login");
    } catch (error) {
      console.error("Error removing token:", error);
    }
  };

  return {
    token,
    setToken: saveToken,
    removeToken,
  };
};

export default useToken;
