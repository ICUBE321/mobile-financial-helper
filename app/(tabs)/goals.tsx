import FontAwesome from "@expo/vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { goalAPI } from "../../src/utils/localStorageAPI";
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from "../../src/utils/theme";

interface GoalField {
  id: string;
  name: string;
  percentage: number;
  amount: number;
  targetAmount: number;
}

export default function GoalsScreen() {
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [goalFields, setGoalFields] = useState<GoalField[]>([]);
  const [isValidTotal, setIsValidTotal] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate if total percentages are valid (<=100%)
  const totalPercentage = goalFields.reduce(
    (sum, field) => sum + field.percentage,
    0
  );
  const isPercentageValid = totalPercentage <= 100;

  // Load goals when component mounts
  const loadGoals = useCallback(async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (userId) {
        const goalData = await goalAPI.getGoals(JSON.parse(userId));
        if (goalData) {
          setTotalAmount(goalData.totalAmount || "");
          setGoalFields(goalData.goalFields || []);
        }
      }
    } catch (error) {
      console.error("Error loading goals:", error);
    }
  }, []);

  // Save goals to storage
  const saveGoals = useCallback(async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      const userId = await AsyncStorage.getItem("userId");
      if (userId) {
        await goalAPI.saveGoals(
          {
            totalAmount,
            goalFields,
          },
          JSON.parse(userId)
        );
      }
    } catch (error) {
      console.error("Error saving goals:", error);
      Alert.alert("Error", "Failed to save goals");
    } finally {
      setIsLoading(false);
    }
  }, [totalAmount, goalFields, isLoading]);

  // Load goals on mount
  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  // Auto-save goals when they change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if ((totalAmount || goalFields.length > 0) && !isLoading) {
        saveGoals();
      }
    }, 1000); // Debounce saves by 1 second

    return () => clearTimeout(timeoutId);
  }, [totalAmount, goalFields, saveGoals, isLoading]);

  useEffect(() => {
    // Update amounts when total amount or percentages change
    const total = parseFloat(totalAmount) || 0;
    setGoalFields((prevFields) =>
      prevFields.map((field) => ({
        ...field,
        amount: (field.percentage / 100) * total,
      }))
    );
  }, [totalAmount]);

  const addGoalField = () => {
    if (goalFields.length >= 5) {
      Alert.alert("Limit Reached", "You can only add up to 5 savings goals");
      return;
    }

    const defaultNames = [
      "Emergency Fund",
      "Vacation Fund",
      "Investment Portfolio",
      "Home Down Payment",
      "Retirement Fund",
    ];

    const newField: GoalField = {
      id: Date.now().toString(),
      name: defaultNames[goalFields.length] || `Goal ${goalFields.length + 1}`,
      percentage: 0,
      amount: 0,
      targetAmount: 0,
    };

    setGoalFields([...goalFields, newField]);
  };

  const removeGoalField = (id: string) => {
    setGoalFields(goalFields.filter((field) => field.id !== id));
  };

  const updateFieldName = (id: string, name: string) => {
    setGoalFields(
      goalFields.map((field) => (field.id === id ? { ...field, name } : field))
    );
  };

  const updateFieldPercentage = (id: string, percentage: number) => {
    const total = parseFloat(totalAmount) || 0;
    const amount = (percentage / 100) * total;

    setGoalFields(
      goalFields.map((field) =>
        field.id === id ? { ...field, percentage, amount } : field
      )
    );
  };

  const updateFieldTargetAmount = (id: string, targetAmount: number) => {
    setGoalFields(
      goalFields.map((field) =>
        field.id === id ? { ...field, targetAmount } : field
      )
    );
  };

  const handleTotalAmountChange = (value: string) => {
    // Allow only numbers and decimal point
    const numericValue = value.replace(/[^0-9.]/g, "");

    // Prevent multiple decimal points
    const parts = numericValue.split(".");
    if (parts.length > 2) return;

    setTotalAmount(numericValue);
    setIsValidTotal(numericValue === "" || !isNaN(parseFloat(numericValue)));
  };

  const resetGoals = () => {
    Alert.alert(
      "Reset Savings Allocation",
      "Are you sure you want to reset all savings allocations?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          onPress: async () => {
            try {
              setTotalAmount("");
              setGoalFields([]);

              // Delete from storage
              const userId = await AsyncStorage.getItem("userId");
              if (userId) {
                await goalAPI.deleteGoals(JSON.parse(userId));
              }
            } catch (error) {
              console.error("Error resetting goals:", error);
              Alert.alert("Error", "Failed to reset savings allocation");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const renderGoalField = (field: GoalField) => (
    <View
      key={field.id}
      style={[
        styles.goalFieldContainer,
        { borderColor: isPercentageValid ? Colors.success : Colors.error },
      ]}
    >
      <View style={styles.goalFieldHeader}>
        <TextInput
          style={styles.goalNameInput}
          value={field.name}
          onChangeText={(text) => updateFieldName(field.id, text)}
          placeholder="Savings goal name"
          maxLength={30}
        />
        <TouchableOpacity
          onPress={() => removeGoalField(field.id)}
          style={styles.removeButton}
        >
          <FontAwesome name="times" size={16} color={Colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.goalFieldContent}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>% of Savings</Text>
          <View style={styles.percentageInputContainer}>
            <TextInput
              style={[
                styles.percentageInput,
                {
                  borderColor: isPercentageValid
                    ? Colors.success
                    : Colors.error,
                  backgroundColor: isPercentageValid
                    ? Colors.success + "10"
                    : Colors.error + "10",
                },
              ]}
              value={field.percentage.toString()}
              onChangeText={(text) => {
                const percentage = parseFloat(text) || 0;
                updateFieldPercentage(field.id, percentage);
              }}
              keyboardType="decimal-pad"
              placeholder="0"
            />
            <Text style={styles.percentageSymbol}>%</Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Allocated Amount</Text>
          <Text style={styles.amountText}>
            $
            {field.amount.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Goal Target</Text>
          <View style={styles.targetInputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.targetInput}
              value={
                field.targetAmount > 0 ? field.targetAmount.toString() : ""
              }
              onChangeText={(text) => {
                const targetAmount = parseFloat(text) || 0;
                updateFieldTargetAmount(field.id, targetAmount);
              }}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
          </View>
        </View>
      </View>

      {/* Progress Section */}
      {field.targetAmount > 0 && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressPercentage}>
              {field.targetAmount > 0
                ? Math.min(
                    100,
                    (field.amount / field.targetAmount) * 100
                  ).toFixed(1)
                : 0}
              %
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(
                    100,
                    (field.amount / field.targetAmount) * 100
                  )}%`,
                  backgroundColor:
                    field.amount >= field.targetAmount
                      ? Colors.success
                      : Colors.primary,
                },
              ]}
            />
          </View>
          <View style={styles.progressAmounts}>
            <Text style={styles.progressText}>
              $
              {field.amount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              saved
            </Text>
            <Text
              style={[
                styles.progressText,
                {
                  color:
                    field.amount >= field.targetAmount
                      ? Colors.success
                      : Colors.textLight,
                },
              ]}
            >
              $
              {(field.targetAmount - field.amount).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              to go
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Savings Allocation</Text>
        <TouchableOpacity style={styles.resetButton} onPress={resetGoals}>
          <FontAwesome name="refresh" size={20} color={Colors.background} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets={true}
          contentInsetAdjustmentBehavior="automatic"
        >
          {/* Total Amount Section */}
          <View style={styles.totalSection}>
            <Text style={styles.sectionTitle}>Total Savings Amount</Text>
            <View style={styles.totalInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={[
                  styles.totalAmountInput,
                  { borderColor: isValidTotal ? Colors.border : Colors.error },
                ]}
                value={totalAmount}
                onChangeText={handleTotalAmountChange}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor={Colors.textLight}
              />
            </View>
            {!isValidTotal && (
              <Text style={styles.errorText}>Please enter a valid amount</Text>
            )}
          </View>

          {/* Summary Section */}
          {totalAmount && parseFloat(totalAmount) > 0 && (
            <View style={styles.summarySection}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Total Allocated to Goals:
                </Text>
                <Text
                  style={[
                    styles.summaryValue,
                    {
                      color: isPercentageValid ? Colors.success : Colors.error,
                    },
                  ]}
                >
                  {totalPercentage.toFixed(1)}%
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Unallocated Savings:</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    {
                      color:
                        100 - totalPercentage >= 0
                          ? Colors.success
                          : Colors.error,
                    },
                  ]}
                >
                  {(100 - totalPercentage).toFixed(1)}%
                </Text>
              </View>
            </View>
          )}

          {/* Goal Fields */}
          <View style={styles.goalsSection}>
            <View style={styles.goalsSectionHeader}>
              <Text style={styles.sectionTitle}>
                Savings Allocation ({goalFields.length}/5)
              </Text>
              <TouchableOpacity
                style={[
                  styles.addButton,
                  { opacity: goalFields.length >= 5 ? 0.5 : 1 },
                ]}
                onPress={addGoalField}
                disabled={goalFields.length >= 5}
              >
                <FontAwesome name="plus" size={16} color={Colors.background} />
                <Text style={styles.addButtonText}>Add Goal</Text>
              </TouchableOpacity>
            </View>

            {goalFields.length === 0 ? (
              <View style={styles.emptyState}>
                <FontAwesome
                  name="bullseye"
                  size={48}
                  color={Colors.textLight}
                />
                <Text style={styles.emptyStateText}>
                  No savings goals added yet
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Tap &quot;Add Goal&quot; to allocate your savings towards
                  specific goals
                </Text>
              </View>
            ) : (
              goalFields.map(renderGoalField)
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
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
  resetButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 4, // Extra bottom padding for keyboard visibility
    flexGrow: 1,
    minHeight: "100%",
  },
  totalSection: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
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
  sectionTitle: {
    ...Typography.heading3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  totalInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
  },
  currencySymbol: {
    ...Typography.heading2,
    color: Colors.textLight,
    marginRight: Spacing.sm,
  },
  totalAmountInput: {
    flex: 1,
    ...Typography.heading2,
    color: Colors.text,
    padding: Spacing.md,
    fontSize: 24,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  summarySection: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    ...Typography.body,
    color: Colors.textLight,
  },
  summaryValue: {
    ...Typography.body,
    fontWeight: "600",
  },
  goalsSection: {
    flex: 1,
  },
  goalsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  addButtonText: {
    color: Colors.background,
    fontWeight: "600",
    marginLeft: Spacing.xs,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xl * 2,
  },
  emptyStateText: {
    ...Typography.heading3,
    color: Colors.textLight,
    marginTop: Spacing.md,
  },
  emptyStateSubtext: {
    ...Typography.body,
    color: Colors.textLight,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  goalFieldContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  goalFieldHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  goalNameInput: {
    ...Typography.heading3,
    color: Colors.text,
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.xs,
  },
  removeButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.md,
  },
  goalFieldContent: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  inputLabel: {
    ...Typography.bodySmall,
    color: Colors.textLight,
    marginBottom: Spacing.xs,
  },
  percentageInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
  },
  percentageInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    padding: Spacing.sm,
    textAlign: "center",
  },
  percentageSymbol: {
    ...Typography.body,
    color: Colors.textLight,
    marginLeft: Spacing.xs,
  },
  amountText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: "600",
    textAlign: "center",
    padding: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  targetInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.background,
  },
  targetInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    padding: Spacing.sm,
    textAlign: "center",
  },
  progressSection: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  progressLabel: {
    ...Typography.bodySmall,
    color: Colors.textLight,
    fontWeight: "600",
  },
  progressPercentage: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: "600",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    marginBottom: Spacing.sm,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  progressAmounts: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressText: {
    ...Typography.bodySmall,
    color: Colors.textLight,
  },
});
