import FontAwesome from "@expo/vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Asset } from "../../src/types/asset";
import { assetAPI } from "../../src/utils/api";
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from "../../src/utils/theme";

interface AssetFormData {
  name: string;
  type: string;
  value: string;
}

export default function AssetsScreen() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isAddMode, setIsAddMode] = useState(false);
  const [formData, setFormData] = useState<AssetFormData>({
    name: "",
    type: "",
    value: "",
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadAssets = useCallback(async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (userId) {
        const data = await assetAPI.getAllAssets(JSON.parse(userId));
        setAssets(data);
      }
    } catch (error) {
      console.error("Error loading assets:", error);
      Alert.alert("Error", "Failed to load assets");
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAssets();
    setRefreshing(false);
  }, [loadAssets]);

  const handleSubmit = async () => {
    try {
      if (!formData.name || !formData.type || !formData.value) {
        Alert.alert("Error", "All fields are required");
        return;
      }

      const userId = await AsyncStorage.getItem("userId");
      if (!userId) throw new Error("User not found");

      const newAsset = {
        name: formData.name,
        type: formData.type,
        value: parseFloat(formData.value),
      };

      await assetAPI.addAsset(newAsset, JSON.parse(userId));
      await loadAssets();
      setIsAddMode(false);
      setFormData({ name: "", type: "", value: "" });
    } catch (error) {
      console.error("Error adding asset:", error);
      Alert.alert("Error", "Failed to add asset");
    }
  };

  const handleDelete = async (assetId: string) => {
    try {
      await assetAPI.deleteAsset(assetId);
      await loadAssets();
    } catch (error) {
      console.error("Error deleting asset:", error);
      Alert.alert("Error", "Failed to delete asset");
    }
  };

  const renderAssetItem = ({ item }: { item: Asset }) => (
    <View style={styles.assetCard}>
      <View>
        <Text style={styles.assetName}>{item.name}</Text>
        <Text style={styles.assetType}>{item.type}</Text>
      </View>
      <View style={styles.rightContent}>
        <Text style={styles.assetValue}>
          ${item.value.toLocaleString("en-US", { maximumFractionDigits: 2 })}
        </Text>
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              "Delete Asset",
              "Are you sure you want to delete this asset?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  onPress: () => handleDelete(item._id),
                  style: "destructive",
                },
              ]
            );
          }}
          style={styles.deleteButton}
        >
          <FontAwesome name="trash-o" size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Your Assets</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsAddMode(!isAddMode)}
        >
          <FontAwesome
            name={isAddMode ? "times" : "plus"}
            size={20}
            color={Colors.background}
          />
        </TouchableOpacity>
      </View>

      {isAddMode && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Asset Name"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Asset Type"
            value={formData.type}
            onChangeText={(text) => setFormData({ ...formData, type: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Value"
            keyboardType="decimal-pad"
            value={formData.value}
            onChangeText={(text) => setFormData({ ...formData, value: text })}
          />
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Add Asset</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={assets}
        renderItem={renderAssetItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.list}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    backgroundColor: Colors.primary,
  },
  title: {
    ...Typography.heading2,
    color: Colors.background,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    padding: Spacing.md,
  },
  assetCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.background,
    padding: Spacing.md,
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
  assetName: {
    ...Typography.heading3,
    color: Colors.text,
  },
  assetType: {
    ...Typography.bodySmall,
    color: Colors.textLight,
    marginTop: 4,
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  assetValue: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: "600",
    marginRight: Spacing.md,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  form: {
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    margin: Spacing.md,
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
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  submitButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: "600",
  },
});
