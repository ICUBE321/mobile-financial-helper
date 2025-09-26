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
import { BudgetAllocation, BudgetFormData } from "../../src/types/budget";
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
        },
        wants: {
          amount: (income * wantsPercentage) / 100,
          percentage: wantsPercentage,
        },
        savings: {
          amount: (income * savingsPercentage) / 100,
          percentage: savingsPercentage,
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
          <View style={[styles.allocationCard, styles.needsCard]}>
            <FontAwesome name="home" size={24} color="#e74c3c" />
            <Text style={styles.allocationLabel}>Needs</Text>
            <Text style={styles.allocationPercentage}>
              {budget.needs.percentage}%
            </Text>
            <Text style={styles.allocationAmount}>
              {getCurrencySymbol(budget.currency)}
              {budget.needs.amount.toLocaleString("en-US", {
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>

          <View style={[styles.allocationCard, styles.wantsCard]}>
            <FontAwesome name="shopping-bag" size={24} color="#f39c12" />
            <Text style={styles.allocationLabel}>Wants</Text>
            <Text style={styles.allocationPercentage}>
              {budget.wants.percentage}%
            </Text>
            <Text style={styles.allocationAmount}>
              {getCurrencySymbol(budget.currency)}
              {budget.wants.amount.toLocaleString("en-US", {
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>

          <View style={[styles.allocationCard, styles.savingsCard]}>
            <FontAwesome name="bank" size={24} color="#27ae60" />
            <Text style={styles.allocationLabel}>Savings</Text>
            <Text style={styles.allocationPercentage}>
              {budget.savings.percentage}%
            </Text>
            <Text style={styles.allocationAmount}>
              {getCurrencySymbol(budget.currency)}
              {budget.savings.amount.toLocaleString("en-US", {
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
        </View>
      </View>
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
});
