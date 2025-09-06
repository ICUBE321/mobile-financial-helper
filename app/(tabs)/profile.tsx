import FontAwesome from "@expo/vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from "../../src/utils/theme";

export default function ProfileScreen() {
  const handleLogout = async () => {
    Alert.alert("Confirm Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove(["token", "userId"]);
            router.replace("/login");
          } catch (error) {
            console.error("Error during logout:", error);
            Alert.alert("Error", "Failed to log out");
          }
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <FontAwesome name="sign-out" size={20} color={Colors.error} />
          <Text style={[styles.menuItemText, { color: Colors.error }]}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.primary,
  },
  title: {
    ...Typography.heading2,
    color: Colors.background,
  },
  content: {
    padding: Spacing.lg,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  menuItemText: {
    ...Typography.body,
    marginLeft: Spacing.md,
  },
});
