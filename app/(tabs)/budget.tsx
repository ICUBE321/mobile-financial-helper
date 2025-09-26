import FontAwesome from "@expo/vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BudgetAllocation,
  BudgetFormData,
  BudgetItem,
  BudgetItemFormData,
} from "../../src/types/budget";
import { budgetAPI } from "../../src/utils/localStorageAPI";
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from "../../src/utils/theme";

export default function BudgetScreen() {
  const [budget, setBudget] = useState<BudgetAllocation | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<BudgetFormData>({
    monthlyIncome: "",
    needsPercentage: "50",
    wantsPercentage: "30",
    savingsPercentage: "20",
    currency: "USD",
  });
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showCategoryDetailModal, setShowCategoryDetailModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    "needs" | "wants" | "savings"
  >("needs");
  const [itemFormData, setItemFormData] = useState<BudgetItemFormData>({
    name: "",
    amount: "",
    category: "needs",
    description: "",
  });
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);

  // Common currencies (reuse from assets screen)
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

  const getCurrencySymbol = (currencyCode: string) => {
    const currency = currencies.find((c) => c.code === currencyCode);
    return currency ? currency.symbol : currencyCode;
  };

  const loadBudget = useCallback(async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (userId) {
        const data = await budgetAPI.getBudgetAllocation(JSON.parse(userId));
        setBudget(data);
        if (data) {
          setFormData({
            monthlyIncome: data.monthlyIncome.toString(),
            needsPercentage: data.needs.percentage.toString(),
            wantsPercentage: data.wants.percentage.toString(),
            savingsPercentage: data.savings.percentage.toString(),
            currency: data.currency,
          });
        }
      }
    } catch (error) {
      console.error("Error loading budget:", error);
      Alert.alert("Error", "Failed to load budget");
    }
  }, []);

  useEffect(() => {
    loadBudget();
  }, [loadBudget]);

  const validatePercentages = (): boolean => {
    const needs = parseFloat(formData.needsPercentage) || 0;
    const wants = parseFloat(formData.wantsPercentage) || 0;
    const savings = parseFloat(formData.savingsPercentage) || 0;

    const total = needs + wants + savings;
    return Math.abs(total - 100) < 0.01; // Allow for small floating point errors
  };

  const handleSubmit = async () => {
    try {
      if (!formData.monthlyIncome || !formData.currency) {
        Alert.alert("Error", "Monthly income and currency are required");
        return;
      }

      if (!validatePercentages()) {
        Alert.alert("Error", "Percentages must add up to 100%");
        return;
      }

      const userId = await AsyncStorage.getItem("userId");
      if (!userId) throw new Error("User not found");

      const income = parseFloat(formData.monthlyIncome);
      const needsPercentage = parseFloat(formData.needsPercentage);
      const wantsPercentage = parseFloat(formData.wantsPercentage);
      const savingsPercentage = parseFloat(formData.savingsPercentage);

      const budgetData = {
        userId: JSON.parse(userId),
        monthlyIncome: income,
        needs: {
          amount: (income * needsPercentage) / 100,
          percentage: needsPercentage,
          items: budget?.needs.items || [],
        },
        wants: {
          amount: (income * wantsPercentage) / 100,
          percentage: wantsPercentage,
          items: budget?.wants.items || [],
        },
        savings: {
          amount: (income * savingsPercentage) / 100,
          percentage: savingsPercentage,
          items: budget?.savings.items || [],
        },
        currency: formData.currency,
      };

      if (budget) {
        await budgetAPI.updateBudgetAllocation(
          { ...budgetData, _id: budget._id },
          JSON.parse(userId)
        );
      } else {
        await budgetAPI.saveBudgetAllocation(budgetData, JSON.parse(userId));
      }

      await loadBudget();
      setIsEditMode(false);
    } catch (error) {
      console.error("Error saving budget:", error);
      Alert.alert("Error", "Failed to save budget");
    }
  };

  const handleAddItem = async () => {
    try {
      if (!itemFormData.name || !itemFormData.amount) {
        Alert.alert("Error", "Item name and amount are required");
        return;
      }

      const userId = await AsyncStorage.getItem("userId");
      if (!userId) throw new Error("User not found");

      const newItem = {
        name: itemFormData.name,
        amount: parseFloat(itemFormData.amount),
        category: itemFormData.category,
        description: itemFormData.description,
      };

      if (editingItem) {
        await budgetAPI.updateBudgetItem(
          editingItem._id,
          newItem,
          JSON.parse(userId)
        );
      } else {
        await budgetAPI.addBudgetItem(newItem, JSON.parse(userId));
      }

      await loadBudget();
      setShowAddItemModal(false);
      setEditingItem(null);
      setItemFormData({
        name: "",
        amount: "",
        category: "needs",
        description: "",
      });
    } catch (error) {
      console.error("Error managing budget item:", error);
      Alert.alert("Error", "Failed to save budget item");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) throw new Error("User not found");

      await budgetAPI.deleteBudgetItem(itemId, JSON.parse(userId));
      await loadBudget();
    } catch (error) {
      console.error("Error deleting budget item:", error);
      Alert.alert("Error", "Failed to delete budget item");
    }
  };

  const openAddItemModal = (category: "needs" | "wants" | "savings") => {
    setSelectedCategory(category);
    setItemFormData({ ...itemFormData, category });
    setShowAddItemModal(true);
  };

  const openEditItemModal = (item: BudgetItem) => {
    setEditingItem(item);
    setItemFormData({
      name: item.name,
      amount: item.amount.toString(),
      category: item.category,
      description: item.description || "",
    });
    setSelectedCategory(item.category);
    setShowAddItemModal(true);
  };

  const calculateCategoryTotal = (items: BudgetItem[]) => {
    return items.reduce((total, item) => total + item.amount, 0);
  };

  const openCategoryDetailModal = (category: "needs" | "wants" | "savings") => {
    setSelectedCategory(category);
    setShowCategoryDetailModal(true);
  };

  const renderBudgetOverview = () => {
    if (!budget) {
      return (
        <View style={styles.emptyState}>
          <FontAwesome name="pie-chart" size={64} color={Colors.textLight} />
          <Text style={styles.emptyStateTitle}>No Budget Set</Text>
          <Text style={styles.emptyStateText}>
            Create your first budget allocation to start managing your finances
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.budgetOverview}>
        <View style={styles.incomeCard}>
          <Text style={styles.incomeLabel}>Monthly Income</Text>
          <Text style={styles.incomeAmount}>
            {getCurrencySymbol(budget.currency)}
            {budget.monthlyIncome.toLocaleString("en-US", {
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>

        <View style={styles.allocationGrid}>
          {renderCategoryCard("needs", budget.needs, "#e74c3c", "home")}
          {renderCategoryCard("wants", budget.wants, "#f39c12", "shopping-bag")}
          {renderCategoryCard("savings", budget.savings, "#27ae60", "bank")}
        </View>
      </View>
    );
  };

  const renderCategoryCard = (
    category: "needs" | "wants" | "savings",
    categoryData: { amount: number; percentage: number; items: BudgetItem[] },
    color: string,
    iconName: string
  ) => {
    const itemsTotal = calculateCategoryTotal(categoryData.items);
    const remaining = categoryData.amount - itemsTotal;
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

    return (
      <TouchableOpacity
        key={category}
        style={[
          styles.allocationCard,
          category === "savings" ? styles.savingsCard : {},
          { borderLeftColor: color },
        ]}
        onPress={() => openCategoryDetailModal(category)}
        activeOpacity={0.7}
      >
        <View style={styles.categoryHeader}>
          <FontAwesome name={iconName as any} size={24} color={color} />
          <TouchableOpacity
            style={[styles.addItemButton, { backgroundColor: color }]}
            onPress={(e) => {
              e.stopPropagation(); // Prevent triggering the card click
              openAddItemModal(category);
            }}
          >
            <FontAwesome name="plus" size={12} color="white" />
          </TouchableOpacity>
        </View>

        <Text style={styles.allocationLabel}>{categoryName}</Text>
        <Text style={styles.allocationPercentage}>
          {categoryData.percentage}%
        </Text>
        <Text style={styles.allocationAmount}>
          {getCurrencySymbol(budget?.currency || "USD")}
          {categoryData.amount.toLocaleString("en-US", {
            maximumFractionDigits: 2,
          })}
        </Text>

        {/* Show items total vs allocated */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Used: {getCurrencySymbol(budget?.currency || "USD")}
            {itemsTotal.toLocaleString("en-US", { maximumFractionDigits: 2 })}
          </Text>
          <Text
            style={[
              styles.progressText,
              remaining < 0 ? styles.overBudget : styles.underBudget,
            ]}
          >
            {remaining >= 0 ? "Remaining: " : "Over by: "}
            {getCurrencySymbol(budget?.currency || "USD")}
            {Math.abs(remaining).toLocaleString("en-US", {
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>

        {/* Show individual items */}
        {categoryData.items.length > 0 && (
          <View style={styles.itemsList}>
            {categoryData.items.slice(0, 3).map((item) => (
              <TouchableOpacity
                key={item._id}
                style={styles.budgetItem}
                onPress={() => openEditItemModal(item)}
              >
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemAmount}>
                  {getCurrencySymbol(budget?.currency || "USD")}
                  {item.amount.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </TouchableOpacity>
            ))}
            {categoryData.items.length > 3 && (
              <Text style={styles.moreItemsText}>
                +{categoryData.items.length - 3} more items
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getCurrentTotal = () => {
    const needs = parseFloat(formData.needsPercentage) || 0;
    const wants = parseFloat(formData.wantsPercentage) || 0;
    const savings = parseFloat(formData.savingsPercentage) || 0;
    return needs + wants + savings;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Budget Allocation</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            if (isEditMode) {
              setIsEditMode(false);
              // Reset form data to current budget values
              if (budget) {
                setFormData({
                  monthlyIncome: budget.monthlyIncome.toString(),
                  needsPercentage: budget.needs.percentage.toString(),
                  wantsPercentage: budget.wants.percentage.toString(),
                  savingsPercentage: budget.savings.percentage.toString(),
                  currency: budget.currency,
                });
              }
            } else {
              setIsEditMode(true);
            }
          }}
        >
          <FontAwesome
            name={isEditMode ? "times" : "edit"}
            size={20}
            color={Colors.background}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {isEditMode ? (
          <View style={styles.form}>
            <Text style={styles.formTitle}>
              {budget ? "Edit Budget" : "Create Budget"}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Monthly Income"
              placeholderTextColor={Colors.textLight}
              keyboardType="decimal-pad"
              value={formData.monthlyIncome}
              onChangeText={(text) =>
                setFormData({ ...formData, monthlyIncome: text })
              }
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

            <View style={styles.percentageSection}>
              <Text style={styles.sectionTitle}>Allocation Percentages</Text>

              <View style={styles.percentageRow}>
                <Text style={styles.percentageLabel}>
                  Needs (50-30-20 rule: 50%)
                </Text>
                <View style={styles.percentageInputContainer}>
                  <TextInput
                    style={styles.percentageInput}
                    keyboardType="decimal-pad"
                    value={formData.needsPercentage}
                    onChangeText={(text) =>
                      setFormData({ ...formData, needsPercentage: text })
                    }
                  />
                  <Text style={styles.percentSymbol}>%</Text>
                </View>
              </View>

              <View style={styles.percentageRow}>
                <Text style={styles.percentageLabel}>
                  Wants (50-30-20 rule: 30%)
                </Text>
                <View style={styles.percentageInputContainer}>
                  <TextInput
                    style={styles.percentageInput}
                    keyboardType="decimal-pad"
                    value={formData.wantsPercentage}
                    onChangeText={(text) =>
                      setFormData({ ...formData, wantsPercentage: text })
                    }
                  />
                  <Text style={styles.percentSymbol}>%</Text>
                </View>
              </View>

              <View style={styles.percentageRow}>
                <Text style={styles.percentageLabel}>
                  Savings (50-30-20 rule: 20%)
                </Text>
                <View style={styles.percentageInputContainer}>
                  <TextInput
                    style={styles.percentageInput}
                    keyboardType="decimal-pad"
                    value={formData.savingsPercentage}
                    onChangeText={(text) =>
                      setFormData({ ...formData, savingsPercentage: text })
                    }
                  />
                  <Text style={styles.percentSymbol}>%</Text>
                </View>
              </View>

              <View style={styles.totalRow}>
                <Text
                  style={[
                    styles.totalText,
                    getCurrentTotal() !== 100 && styles.totalError,
                  ]}
                >
                  Total: {getCurrentTotal()}%
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                getCurrentTotal() !== 100 && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={getCurrentTotal() !== 100}
            >
              <Text style={styles.submitButtonText}>
                {budget ? "Update Budget" : "Create Budget"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          renderBudgetOverview()
        )}
      </ScrollView>

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
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownTitle}>Select Currency</Text>
            <FlatList
              data={currencies}
              keyExtractor={(item) => item.code}
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
                    <View>
                      <Text style={styles.dropdownItemText}>
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

      {/* Budget Item Add/Edit Modal */}
      <Modal
        visible={showAddItemModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowAddItemModal(false);
          setEditingItem(null);
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.itemModalContainer}>
            <View style={styles.itemModalHeader}>
              <Text style={styles.itemModalTitle}>
                {editingItem ? "Edit" : "Add"}{" "}
                {selectedCategory.charAt(0).toUpperCase() +
                  selectedCategory.slice(1)}{" "}
                Item
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddItemModal(false);
                  setEditingItem(null);
                }}
              >
                <FontAwesome name="times" size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.itemModalContent}>
              <TextInput
                style={styles.input}
                placeholder="Item name (e.g., Rent, Groceries)"
                placeholderTextColor={Colors.textLight}
                value={itemFormData.name}
                onChangeText={(text) =>
                  setItemFormData({ ...itemFormData, name: text })
                }
              />

              <TextInput
                style={styles.input}
                placeholder="Amount"
                placeholderTextColor={Colors.textLight}
                keyboardType="decimal-pad"
                value={itemFormData.amount}
                onChangeText={(text) =>
                  setItemFormData({ ...itemFormData, amount: text })
                }
              />

              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Description (optional)"
                placeholderTextColor={Colors.textLight}
                multiline
                numberOfLines={3}
                value={itemFormData.description}
                onChangeText={(text) =>
                  setItemFormData({ ...itemFormData, description: text })
                }
              />

              <View style={styles.modalButtonContainer}>
                {editingItem && (
                  <TouchableOpacity
                    style={[styles.modalButton, styles.deleteButton]}
                    onPress={() => {
                      Alert.alert(
                        "Delete Item",
                        "Are you sure you want to delete this item?",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Delete",
                            style: "destructive",
                            onPress: () => {
                              handleDeleteItem(editingItem._id);
                              setShowAddItemModal(false);
                              setEditingItem(null);
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleAddItem}
                >
                  <Text style={styles.saveButtonText}>
                    {editingItem ? "Update" : "Add"} Item
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Category Detail Modal */}
      <Modal
        visible={showCategoryDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryDetailModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryDetailModal(false)}
        >
          <View
            style={styles.categoryDetailContainer}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.categoryDetailHeader}>
              <Text style={styles.categoryDetailTitle}>
                {selectedCategory.charAt(0).toUpperCase() +
                  selectedCategory.slice(1)}{" "}
                Items
                {budget && (
                  <Text style={styles.categoryDetailSubtitle}>
                    {" "}
                    ({getCurrencySymbol(budget.currency)}
                    {budget[selectedCategory].amount.toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })}{" "}
                    allocated)
                  </Text>
                )}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCategoryDetailModal(false)}
              >
                <FontAwesome name="times" size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.categoryDetailContent}>
              {budget && budget[selectedCategory].items.length > 0 ? (
                <>
                  <View style={styles.categoryStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Total Items</Text>
                      <Text style={styles.statValue}>
                        {budget[selectedCategory].items.length}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Total Spent</Text>
                      <Text style={styles.statValue}>
                        {getCurrencySymbol(budget.currency)}
                        {calculateCategoryTotal(
                          budget[selectedCategory].items
                        ).toLocaleString("en-US", { maximumFractionDigits: 2 })}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Remaining</Text>
                      <Text
                        style={[
                          styles.statValue,
                          budget[selectedCategory].amount -
                            calculateCategoryTotal(
                              budget[selectedCategory].items
                            ) <
                          0
                            ? styles.overBudget
                            : styles.underBudget,
                        ]}
                      >
                        {getCurrencySymbol(budget.currency)}
                        {Math.abs(
                          budget[selectedCategory].amount -
                            calculateCategoryTotal(
                              budget[selectedCategory].items
                            )
                        ).toLocaleString("en-US", { maximumFractionDigits: 2 })}
                      </Text>
                    </View>
                  </View>

                  <FlatList
                    data={budget[selectedCategory].items}
                    keyExtractor={(item) => item._id}
                    style={styles.itemsDetailList}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.itemDetailCard}
                        onPress={() => {
                          setShowCategoryDetailModal(false);
                          openEditItemModal(item);
                        }}
                      >
                        <View style={styles.itemDetailMain}>
                          <Text style={styles.itemDetailName}>{item.name}</Text>
                          <Text style={styles.itemDetailAmount}>
                            {getCurrencySymbol(budget.currency)}
                            {item.amount.toLocaleString("en-US", {
                              maximumFractionDigits: 2,
                            })}
                          </Text>
                        </View>
                        {item.description && (
                          <Text style={styles.itemDetailDescription}>
                            {item.description}
                          </Text>
                        )}
                        <FontAwesome
                          name="chevron-right"
                          size={16}
                          color={Colors.textLight}
                          style={styles.itemDetailChevron}
                        />
                      </TouchableOpacity>
                    )}
                    showsVerticalScrollIndicator={false}
                  />

                  <TouchableOpacity
                    style={styles.addMoreItemsButton}
                    onPress={() => {
                      setShowCategoryDetailModal(false);
                      openAddItemModal(selectedCategory);
                    }}
                  >
                    <FontAwesome
                      name="plus"
                      size={16}
                      color={Colors.background}
                    />
                    <Text style={styles.addMoreItemsText}>Add More Items</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.emptyCategory}>
                  <FontAwesome
                    name={
                      selectedCategory === "needs"
                        ? "home"
                        : selectedCategory === "wants"
                        ? "shopping-bag"
                        : "bank"
                    }
                    size={48}
                    color={Colors.textLight}
                  />
                  <Text style={styles.emptyCategoryTitle}>
                    No {selectedCategory} items yet
                  </Text>
                  <Text style={styles.emptyCategoryText}>
                    Start adding items to track your {selectedCategory} expenses
                  </Text>
                  <TouchableOpacity
                    style={styles.addFirstItemButton}
                    onPress={() => {
                      setShowCategoryDetailModal(false);
                      openAddItemModal(selectedCategory);
                    }}
                  >
                    <Text style={styles.addFirstItemText}>Add First Item</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
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
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyStateTitle: {
    ...Typography.heading2,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyStateText: {
    ...Typography.body,
    color: Colors.textLight,
    textAlign: "center",
    lineHeight: 22,
  },
  budgetOverview: {
    flex: 1,
  },
  incomeCard: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    alignItems: "center",
  },
  incomeLabel: {
    ...Typography.body,
    color: Colors.background,
    opacity: 0.9,
    marginBottom: Spacing.xs,
  },
  incomeAmount: {
    ...Typography.heading1,
    color: Colors.background,
    fontWeight: "bold",
  },
  allocationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  allocationCard: {
    width: "48%",
    backgroundColor: Colors.background,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    alignItems: "center",
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
  needsCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#e74c3c",
  },
  wantsCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#f39c12",
  },
  savingsCard: {
    width: "100%",
    borderLeftWidth: 4,
    borderLeftColor: "#27ae60",
  },
  allocationLabel: {
    ...Typography.bodySmall,
    color: Colors.textLight,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  allocationPercentage: {
    ...Typography.heading2,
    color: Colors.text,
    fontWeight: "bold",
    marginBottom: Spacing.xs,
  },
  allocationAmount: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: "600",
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: Spacing.xs,
  },
  addItemButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  progressContainer: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    width: "100%",
  },
  progressText: {
    ...Typography.bodySmall,
    color: Colors.textLight,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  overBudget: {
    color: Colors.error,
    fontWeight: "600",
  },
  underBudget: {
    color: Colors.success,
    fontWeight: "600",
  },
  itemsList: {
    marginTop: Spacing.sm,
    width: "100%",
  },
  budgetItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.background + "80",
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  itemName: {
    ...Typography.bodySmall,
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  itemAmount: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: "600",
  },
  moreItemsText: {
    ...Typography.bodySmall,
    color: Colors.textLight,
    textAlign: "center",
    fontStyle: "italic",
    marginTop: Spacing.xs,
  },
  form: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
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
    ...Typography.heading2,
    color: Colors.text,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    fontSize: 16,
    color: Colors.text,
  },
  currencySelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.background,
  },
  currencySelectorText: {
    fontSize: 16,
    color: Colors.text,
  },
  percentageSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.heading3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  percentageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  percentageLabel: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.md,
  },
  percentageInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
  },
  percentageInput: {
    padding: Spacing.sm,
    fontSize: 16,
    color: Colors.text,
    textAlign: "right",
    minWidth: 60,
  },
  percentSymbol: {
    ...Typography.body,
    color: Colors.textLight,
    marginLeft: Spacing.xs,
  },
  totalRow: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalText: {
    ...Typography.heading3,
    color: Colors.primary,
    textAlign: "right",
    fontWeight: "bold",
  },
  totalError: {
    color: Colors.error,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: Colors.textLight,
    opacity: 0.5,
  },
  submitButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: Spacing.md,
  },
  dropdownContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    width: "85%",
    maxHeight: 350,
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
    backgroundColor: Colors.primary + "20",
  },
  dropdownItemText: {
    fontSize: 16,
    color: Colors.text,
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
  itemModalContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    width: "90%",
    maxHeight: "80%",
  },
  itemModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemModalTitle: {
    ...Typography.heading3,
    color: Colors.text,
    flex: 1,
  },
  itemModalContent: {
    padding: Spacing.lg,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: "top",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.lg,
  },
  modalButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginHorizontal: Spacing.xs,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: Colors.error,
  },
  deleteButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: "600",
  },
  // Category Detail Modal Styles
  categoryDetailContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    width: "100%",
    maxHeight: "85%",
    minHeight: "50%",
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
  categoryDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryDetailTitle: {
    ...Typography.heading3,
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.md,
  },
  categoryDetailSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textLight,
    fontWeight: "normal",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryDetailContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  categoryStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: Colors.primary + "10",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    ...Typography.bodySmall,
    color: Colors.textLight,
    marginBottom: Spacing.xs,
  },
  statValue: {
    ...Typography.heading3,
    color: Colors.text,
    fontWeight: "bold",
  },
  itemsDetailList: {
    flex: 1,
    marginBottom: Spacing.lg,
  },
  itemDetailCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  itemDetailMain: {
    flex: 1,
  },
  itemDetailName: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  itemDetailAmount: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: "bold",
  },
  itemDetailDescription: {
    ...Typography.bodySmall,
    color: Colors.textLight,
    marginTop: Spacing.xs,
    flex: 1,
  },
  itemDetailChevron: {
    marginLeft: Spacing.sm,
  },
  addMoreItemsButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  addMoreItemsText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: Spacing.sm,
  },
  emptyCategory: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  emptyCategoryTitle: {
    ...Typography.heading3,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyCategoryText: {
    ...Typography.body,
    color: Colors.textLight,
    textAlign: "center",
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  addFirstItemButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  addFirstItemText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: "600",
  },
});
