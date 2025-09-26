import FontAwesome from "@expo/vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Asset } from "../../src/types/asset";
import { assetAPI } from "../../src/utils/localStorageAPI";
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
  currency: string;
}

export default function AssetsScreen() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isAddMode, setIsAddMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [formData, setFormData] = useState<AssetFormData>({
    name: "",
    type: "",
    value: "",
    currency: "USD",
  });
  const [refreshing, setRefreshing] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  // Common currencies with their symbols
  const currencies = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
    { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
    { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "BTC", symbol: "₿", name: "Bitcoin" },
    { code: "ETH", symbol: "Ξ", name: "Ethereum" },
  ];

  // Helper function to get currency symbol
  const getCurrencySymbol = (currencyCode: string) => {
    const currency = currencies.find((c) => c.code === currencyCode);
    return currency ? currency.symbol : currencyCode;
  };

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

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAssets();
    setRefreshing(false);
  }, [loadAssets]);

  const handleSubmit = async () => {
    try {
      if (
        !formData.name ||
        !formData.type ||
        !formData.value ||
        !formData.currency
      ) {
        Alert.alert("Error", "All fields are required");
        return;
      }

      const userId = await AsyncStorage.getItem("userId");
      if (!userId) throw new Error("User not found");

      const newAsset = {
        name: formData.name,
        type: formData.type,
        value: parseFloat(formData.value),
        currency: formData.currency,
      };

      await assetAPI.addAsset(newAsset, JSON.parse(userId));
      await loadAssets();
      setIsAddMode(false);
      setFormData({ name: "", type: "", value: "", currency: "USD" });
    } catch (error) {
      console.error("Error adding asset:", error);
      Alert.alert("Error", "Failed to add asset");
    }
  };

  const handleUpdate = async () => {
    try {
      if (
        !formData.name ||
        !formData.type ||
        !formData.value ||
        !formData.currency ||
        !editingAsset
      ) {
        Alert.alert("Error", "All fields are required");
        return;
      }

      const updatedAsset = {
        name: formData.name,
        type: formData.type,
        value: parseFloat(formData.value),
        currency: formData.currency,
      };

      await assetAPI.updateAsset(editingAsset._id, updatedAsset);
      await loadAssets();
      setIsEditMode(false);
      setEditingAsset(null);
      setFormData({ name: "", type: "", value: "", currency: "USD" });
    } catch (error) {
      console.error("Error updating asset:", error);
      Alert.alert("Error", "Failed to update asset");
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

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      type: asset.type,
      value: asset.value.toString(),
      currency: asset.currency,
    });
    setIsEditMode(true);
    setIsAddMode(false);
  };

  const renderAssetItem = ({ item }: { item: Asset }) => (
    <View style={styles.assetCard}>
      <View>
        <Text style={styles.assetName}>{item.name}</Text>
        <Text style={styles.assetType}>{item.type}</Text>
      </View>
      <View style={styles.rightContent}>
        <Text style={styles.assetValue}>
          {getCurrencySymbol(item.currency)}
          {item.value.toLocaleString("en-US", { maximumFractionDigits: 2 })}
        </Text>
        <TouchableOpacity
          onPress={() => handleEditAsset(item)}
          style={styles.editButton}
        >
          <FontAwesome name="edit" size={20} color={Colors.primary} />
        </TouchableOpacity>
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
          onPress={() => {
            if (isAddMode || isEditMode) {
              // Close any open form
              setIsAddMode(false);
              setIsEditMode(false);
              setEditingAsset(null);
              setFormData({ name: "", type: "", value: "", currency: "USD" });
            } else {
              // Open add mode
              setIsAddMode(true);
            }
          }}
        >
          <FontAwesome
            name={isAddMode || isEditMode ? "times" : "plus"}
            size={20}
            color={Colors.background}
          />
        </TouchableOpacity>
      </View>

      {(isAddMode || isEditMode) && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>
            {isEditMode ? "Edit Asset" : "Add New Asset"}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Asset Name"
            placeholderTextColor={Colors.text}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Asset Type"
            placeholderTextColor={Colors.text}
            value={formData.type}
            onChangeText={(text) => setFormData({ ...formData, type: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Value"
            placeholderTextColor={Colors.text}
            keyboardType="decimal-pad"
            value={formData.value}
            onChangeText={(text) => setFormData({ ...formData, value: text })}
          />

          <TouchableOpacity
            style={styles.currencySelector}
            onPress={() => setShowCurrencyDropdown(true)}
          >
            <Text style={styles.currencySelectorText}>
              Currency: {formData.currency}
            </Text>
            <FontAwesome
              name="chevron-down"
              size={16}
              color={Colors.textLight}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={isEditMode ? handleUpdate : handleSubmit}
          >
            <Text style={styles.submitButtonText}>
              {isEditMode ? "Update Asset" : "Add Asset"}
            </Text>
          </TouchableOpacity>

          {isEditMode && (
            <TouchableOpacity
              style={[styles.submitButton, styles.cancelButton]}
              onPress={() => {
                setIsEditMode(false);
                setEditingAsset(null);
                setFormData({ name: "", type: "", value: "", currency: "USD" });
              }}
            >
              <Text style={styles.submitButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
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

      {/* Currency Selection Modal */}
      <Modal
        visible={showCurrencyDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCurrencyDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCurrencyDropdown(false)}
        >
          <View
            style={styles.dropdownContainer}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.dropdownTitle}>Select Currency</Text>
            <FlatList
              data={currencies}
              keyExtractor={(item) => item.code}
              style={styles.currencyScrollView}
              showsVerticalScrollIndicator={true}
              bounces={true}
              scrollEventThrottle={16}
              renderItem={({ item: currency }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    formData.currency === currency.code &&
                      styles.dropdownItemSelected,
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, currency: currency.code });
                    setShowCurrencyDropdown(false);
                  }}
                >
                  <View style={styles.currencyInfo}>
                    <Text style={styles.currencySymbol}>{currency.symbol}</Text>
                    <View style={styles.currencyTextContainer}>
                      <Text
                        style={[
                          styles.dropdownItemText,
                          formData.currency === currency.code &&
                            styles.dropdownItemTextSelected,
                        ]}
                      >
                        {currency.code}
                      </Text>
                      <Text style={styles.currencyName}>{currency.name}</Text>
                    </View>
                  </View>
                  {formData.currency === currency.code && (
                    <FontAwesome
                      name="check"
                      size={16}
                      color={Colors.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
  editButton: {
    padding: Spacing.xs,
    marginRight: Spacing.xs,
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
  formTitle: {
    ...Typography.heading3,
    color: Colors.text,
    textAlign: "center",
    marginBottom: Spacing.md,
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
    marginBottom: Spacing.sm,
  },
  cancelButton: {
    backgroundColor: Colors.textLight,
    marginBottom: 0,
  },
  submitButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: "600",
  },
  currencySelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.background,
  },
  currencySelectorText: {
    fontSize: 16,
    color: Colors.text,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  dropdownContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    height: 350,
    width: "85%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  dropdownItemSelected: {
    backgroundColor: Colors.primary + "20", // Add opacity
  },
  dropdownItemText: {
    fontSize: 16,
    color: Colors.text,
  },
  dropdownItemTextSelected: {
    color: Colors.primary,
    fontWeight: "600",
  },
  currencyInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.primary,
    width: 32,
    textAlign: "center",
    marginRight: Spacing.sm,
  },
  currencyName: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  currencyScrollView: {
    flex: 1,
    marginTop: 10,
  },
  currencyTextContainer: {
    flex: 1,
  },
});
