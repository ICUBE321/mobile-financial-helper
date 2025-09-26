import { storageUtils } from "@/src/utils/localStorageAPI";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Share,
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
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    // Get current user ID (you may have this in your app state/context)
    // For now, we'll use a default or first user
    const getCurrentUser = async () => {
      try {
        const users = await storageUtils.getStorageData("users");
        if (users && users.length > 0) {
          setCurrentUserId(users[0]._id);
        }
      } catch (error) {
        console.error("Error getting current user:", error);
      }
    };
    getCurrentUser();
  }, []);

  const handleExportData = async () => {
    try {
      setIsLoading(true);

      Alert.alert("Export Data", "Choose export format:", [
        {
          text: "Full Backup",
          onPress: () => exportFullData(),
        },
        {
          text: "User-Friendly",
          onPress: () => exportUserFriendlyData(),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]);
    } catch (error) {
      console.error("Error in export options:", error);
      Alert.alert("Error", "Failed to show export options");
    } finally {
      setIsLoading(false);
    }
  };

  const exportFullData = async () => {
    try {
      setIsLoading(true);
      const data = await storageUtils.exportData();

      if (data) {
        const fileName = `wealth_manager_backup_${
          new Date().toISOString().split("T")[0]
        }.json`;

        if (Platform.OS === "ios" || Platform.OS === "android") {
          // Use Share API for mobile
          await Share.share({
            message: data,
            title: "Wealth Manager Data Backup",
          });
        } else {
          // For web, create download
          const blob = new Blob([data], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = fileName;
          a.click();
          URL.revokeObjectURL(url);
        }

        Alert.alert(
          "Export Complete",
          "Your backup data has been exported successfully!"
        );
      } else {
        Alert.alert("Error", "Failed to export data");
      }
    } catch (error) {
      console.error("Error exporting full data:", error);
      Alert.alert("Error", "Failed to export data");
    } finally {
      setIsLoading(false);
    }
  };

  const exportUserFriendlyData = async () => {
    try {
      setIsLoading(true);
      if (!currentUserId) {
        Alert.alert("Error", "No user found to export data for");
        return;
      }

      const data = await storageUtils.exportUserFriendlyData(currentUserId);

      if (data) {
        const fileName = `wealth_manager_report_${
          new Date().toISOString().split("T")[0]
        }.json`;

        if (Platform.OS === "ios" || Platform.OS === "android") {
          // Use Share API for mobile
          await Share.share({
            message: data,
            title: "Wealth Manager Financial Report",
          });
        } else {
          // For web, create download
          const blob = new Blob([data], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = fileName;
          a.click();
          URL.revokeObjectURL(url);
        }

        Alert.alert(
          "Export Complete",
          "Your financial report has been exported successfully!"
        );
      } else {
        Alert.alert("Error", "Failed to export report data");
      }
    } catch (error) {
      console.error("Error exporting user-friendly data:", error);
      Alert.alert("Error", "Failed to export report data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportData = async () => {
    try {
      Alert.alert(
        "Import Data",
        "This will import data and may overwrite existing information. A backup will be created first. Continue?",
        [
          {
            text: "Yes, Import",
            onPress: () => proceedWithImport(),
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    } catch (error) {
      console.error("Error in import:", error);
      Alert.alert("Error", "Failed to initiate import");
    }
  };

  const proceedWithImport = async () => {
    try {
      setIsLoading(true);

      // Create backup first
      if (currentUserId) {
        const backupKey = await storageUtils.createBackup(currentUserId);
        if (!backupKey) {
          Alert.alert(
            "Warning",
            "Failed to create backup, but continuing with import..."
          );
        }
      }

      // For web, use file input
      if (Platform.OS === "web") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = async (e: any) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
              try {
                const content = e.target?.result as string;
                await processImportData(content);
              } catch (error) {
                Alert.alert("Error", "Failed to read file");
              }
            };
            reader.readAsText(file);
          }
        };
        input.click();
      } else {
        // For mobile, would need document picker (to be implemented)
        Alert.alert(
          "Import on Mobile",
          "Mobile import feature requires additional setup. For now, please use the web version for importing data.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error in import process:", error);
      Alert.alert("Error", "Failed to import data");
    } finally {
      setIsLoading(false);
    }
  };

  const processImportData = async (dataString: string) => {
    try {
      const result = await storageUtils.importData(dataString, currentUserId);

      if (result.success) {
        Alert.alert(
          "Import Successful",
          `Data imported successfully!\n\nImported:\n• Users: ${result.importedData.users}\n• Assets: ${result.importedData.assets}\n• Growth Records: ${result.importedData.growth}\n• Goals: ${result.importedData.goals}\n• Budgets: ${result.importedData.budgets}`,
          [
            {
              text: "Restart App",
              onPress: () => {
                // You might want to reload the app or navigate to home
                router.replace("/");
              },
            },
          ]
        );
      } else {
        Alert.alert("Import Failed", "Failed to import data");
      }
    } catch (error) {
      console.error("Error processing import:", error);
      Alert.alert(
        "Import Error",
        error instanceof Error ? error.message : "Failed to process import data"
      );
    }
  };

  const handleClearData = async () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all your data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await storageUtils.clearAllData();
              await AsyncStorage.multiRemove(["token", "userId"]);
              Alert.alert("Success", "All data has been cleared", [
                {
                  text: "OK",
                  onPress: () => router.replace("/(auth)/login"),
                },
              ]);
            } catch (error) {
              console.error("Error clearing data:", error);
              Alert.alert("Error", "Failed to clear data");
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert("Confirm Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove(["token", "userId"]);
            router.replace("/(auth)/login");
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

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity style={styles.menuItem} onPress={handleExportData}>
          <FontAwesome name="download" size={20} color={Colors.text} />
          <Text style={styles.menuItemText}>Export Data</Text>
          {isLoading && (
            <ActivityIndicator
              size="small"
              color={Colors.primary}
              style={{ marginLeft: 10 }}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleImportData}>
          <FontAwesome name="upload" size={20} color={Colors.primary} />
          <Text style={[styles.menuItemText, { color: Colors.primary }]}>
            Import Data
          </Text>
          {isLoading && (
            <ActivityIndicator
              size="small"
              color={Colors.primary}
              style={{ marginLeft: 10 }}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleClearData}>
          <FontAwesome name="trash" size={20} color={Colors.error} />
          <Text style={[styles.menuItemText, { color: Colors.error }]}>
            Clear All Data
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <FontAwesome name="sign-out" size={20} color={Colors.error} />
          <Text style={[styles.menuItemText, { color: Colors.error }]}>
            Logout
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.lg,
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
