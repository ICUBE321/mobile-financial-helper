import AsyncStorage from "@react-native-async-storage/async-storage";

// Budget APIs using local storage
import { BudgetAllocation } from "../types/budget";

// Local storage keys
const KEYS = {
  USERS: "users",
  ASSETS: "assets",
  GROWTH: "growth",
  GOALS: "goals",
  USER_COUNTER: "userCounter",
  ASSET_COUNTER: "assetCounter",
  GROWTH_COUNTER: "growthCounter",
  GOAL_COUNTER: "goalCounter",
};

// Helper functions for local storage
const getStorageData = async (key: string, defaultValue: any = []) => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error getting ${key}:`, error);
    return defaultValue;
  }
};

const setStorageData = async (key: string, data: any) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
  }
};

const getNextId = async (counterKey: string) => {
  const counter = await getStorageData(counterKey, 1);
  await setStorageData(counterKey, counter + 1);
  return counter;
};

// Asset APIs using local storage
export const assetAPI = {
  getAllAssets: async (userId: string) => {
    const assets = await getStorageData(KEYS.ASSETS);
    return assets
      .filter((asset: any) => asset.userId === userId)
      .map((asset: any) => ({
        ...asset,
        currency: asset.currency || "USD", // Default to USD for existing assets
      }));
  },

  addAsset: async (asset: any, userId: string) => {
    const assets = await getStorageData(KEYS.ASSETS);
    const newAsset = {
      _id: await getNextId(KEYS.ASSET_COUNTER),
      ...asset,
      userId,
    };
    assets.push(newAsset);
    await setStorageData(KEYS.ASSETS, assets);
    return newAsset;
  },

  updateAsset: async (assetId: string, asset: any) => {
    const assets = await getStorageData(KEYS.ASSETS);
    const assetIndex = assets.findIndex(
      (a: any) => a._id.toString() === assetId
    );

    if (assetIndex !== -1) {
      assets[assetIndex] = { ...assets[assetIndex], ...asset };
      await setStorageData(KEYS.ASSETS, assets);
      return assets[assetIndex];
    }
    throw new Error("Asset not found");
  },

  deleteAsset: async (assetId: string) => {
    const assets = await getStorageData(KEYS.ASSETS);
    const filteredAssets = assets.filter(
      (a: any) => a._id.toString() !== assetId
    );
    await setStorageData(KEYS.ASSETS, filteredAssets);
    return { message: "Asset deleted" };
  },
};

// Goals APIs using local storage
export const goalAPI = {
  getGoals: async (userId: string) => {
    const goals = await getStorageData(KEYS.GOALS);
    return goals.find((goal: any) => goal.userId === userId) || null;
  },

  saveGoals: async (goalData: any, userId: string) => {
    const goals = await getStorageData(KEYS.GOALS);
    const existingGoalIndex = goals.findIndex(
      (goal: any) => goal.userId === userId
    );

    const goalRecord = {
      _id:
        existingGoalIndex !== -1
          ? goals[existingGoalIndex]._id
          : await getNextId(KEYS.GOAL_COUNTER),
      ...goalData,
      userId,
      updatedAt: new Date().toISOString(),
    };

    if (existingGoalIndex !== -1) {
      goals[existingGoalIndex] = goalRecord;
    } else {
      goals.push(goalRecord);
    }

    await setStorageData(KEYS.GOALS, goals);
    return goalRecord;
  },

  deleteGoals: async (userId: string) => {
    const goals = await getStorageData(KEYS.GOALS);
    const filteredGoals = goals.filter((goal: any) => goal.userId !== userId);
    await setStorageData(KEYS.GOALS, filteredGoals);
    return { message: "Goals deleted" };
  },
};

// Auth APIs using local storage
export const authAPI = {
  login: async (email: string, password: string) => {
    const users = await getStorageData(KEYS.USERS);
    const user = users.find(
      (u: any) => u.email === email && u.password === password
    );

    if (user) {
      return {
        token: `local-token-${user._id}`,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      };
    }
    throw new Error("Invalid credentials");
  },

  signup: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => {
    const users = await getStorageData(KEYS.USERS);

    // Check if user already exists
    if (users.find((u: any) => u.email === userData.email)) {
      throw new Error("User already exists");
    }

    const newUser = {
      _id: await getNextId(KEYS.USER_COUNTER),
      ...userData,
    };

    users.push(newUser);
    await setStorageData(KEYS.USERS, users);

    return {
      token: `local-token-${newUser._id}`,
      user: {
        _id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
      },
    };
  },
};

// Growth Monitoring APIs using local storage
export const growthAPI = {
  getPortfolioGrowth: async (userId: string) => {
    const growth = await getStorageData(KEYS.GROWTH);
    return growth.filter((g: any) => g.userId === userId);
  },

  addPortfolioValue: async (data: {
    portfolioValue: number;
    month: string;
    isInitialValue: boolean;
    userId: string;
  }) => {
    const growth = await getStorageData(KEYS.GROWTH);
    const newGrowth = {
      _id: await getNextId(KEYS.GROWTH_COUNTER),
      ...data,
    };
    growth.push(newGrowth);
    await setStorageData(KEYS.GROWTH, growth);
    return newGrowth;
  },

  // Auto-calculate portfolio growth from assets
  calculateAndSaveGrowth: async (userId: string) => {
    const assets = await assetAPI.getAllAssets(userId);
    const totalValue = assets.reduce(
      (sum: number, asset: any) => sum + asset.value,
      0
    );

    if (totalValue > 0) {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const existingGrowth = await growthAPI.getPortfolioGrowth(userId);

      // Check if we already have data for this month
      const hasCurrentMonth = existingGrowth.some(
        (g: any) => g.month === currentMonth
      );

      if (!hasCurrentMonth) {
        await growthAPI.addPortfolioValue({
          portfolioValue: totalValue,
          month: currentMonth,
          isInitialValue: existingGrowth.length === 0,
          userId,
        });
      }
    }
  },
};

export const budgetAPI = {
  async getBudgetAllocation(userId: string): Promise<BudgetAllocation | null> {
    try {
      const data = await AsyncStorage.getItem(`budget_${userId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error getting budget allocation:", error);
      throw error;
    }
  },

  async saveBudgetAllocation(
    budget: Omit<BudgetAllocation, "_id" | "createdAt" | "updatedAt">,
    userId: string
  ): Promise<BudgetAllocation> {
    try {
      const newBudget: BudgetAllocation = {
        ...budget,
        _id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await AsyncStorage.setItem(`budget_${userId}`, JSON.stringify(newBudget));
      return newBudget;
    } catch (error) {
      console.error("Error saving budget allocation:", error);
      throw error;
    }
  },

  async updateBudgetAllocation(
    budget: Omit<BudgetAllocation, "createdAt" | "updatedAt">,
    userId: string
  ): Promise<BudgetAllocation> {
    try {
      const existingBudget = await this.getBudgetAllocation(userId);
      const updatedBudget: BudgetAllocation = {
        ...budget,
        createdAt: existingBudget?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      await AsyncStorage.setItem(
        `budget_${userId}`,
        JSON.stringify(updatedBudget)
      );
      return updatedBudget;
    } catch (error) {
      console.error("Error updating budget allocation:", error);
      throw error;
    }
  },

  async addBudgetItem(
    item: Omit<import("../types/budget").BudgetItem, "_id">,
    userId: string
  ): Promise<import("../types/budget").BudgetItem> {
    try {
      const budget = await this.getBudgetAllocation(userId);
      if (!budget) {
        throw new Error("Budget allocation not found");
      }

      const newItem: import("../types/budget").BudgetItem = {
        ...item,
        _id: Date.now().toString(),
      };

      budget[item.category].items.push(newItem);
      await this.updateBudgetAllocation(budget, userId);
      return newItem;
    } catch (error) {
      console.error("Error adding budget item:", error);
      throw error;
    }
  },

  async updateBudgetItem(
    itemId: string,
    updates: Partial<Omit<import("../types/budget").BudgetItem, "_id">>,
    userId: string
  ): Promise<import("../types/budget").BudgetItem> {
    try {
      const budget = await this.getBudgetAllocation(userId);
      if (!budget) {
        throw new Error("Budget allocation not found");
      }

      let updatedItem: import("../types/budget").BudgetItem | null = null;

      // Find and update the item in the appropriate category
      const categories: ("needs" | "wants" | "savings")[] = [
        "needs",
        "wants",
        "savings",
      ];
      categories.forEach((category) => {
        const categoryData = budget[category];
        const itemIndex = categoryData.items.findIndex(
          (item: any) => item._id === itemId
        );
        if (itemIndex !== -1) {
          categoryData.items[itemIndex] = {
            ...categoryData.items[itemIndex],
            ...updates,
          };
          updatedItem = categoryData.items[itemIndex];
        }
      });

      if (!updatedItem) {
        throw new Error("Budget item not found");
      }

      await this.updateBudgetAllocation(budget, userId);
      return updatedItem;
    } catch (error) {
      console.error("Error updating budget item:", error);
      throw error;
    }
  },

  async deleteBudgetItem(itemId: string, userId: string): Promise<void> {
    try {
      const budget = await this.getBudgetAllocation(userId);
      if (!budget) {
        throw new Error("Budget allocation not found");
      }

      // Remove the item from the appropriate category
      const categories: ("needs" | "wants" | "savings")[] = [
        "needs",
        "wants",
        "savings",
      ];
      categories.forEach((category) => {
        const categoryData = budget[category];
        const itemIndex = categoryData.items.findIndex(
          (item: any) => item._id === itemId
        );
        if (itemIndex !== -1) {
          categoryData.items.splice(itemIndex, 1);
        }
      });

      await this.updateBudgetAllocation(budget, userId);
    } catch (error) {
      console.error("Error deleting budget item:", error);
      throw error;
    }
  },
};

// Utility functions for data management
export const storageUtils = {
  // Direct storage access
  getStorageData,
  setStorageData,

  // Clear all data
  clearAllData: async () => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error("Error clearing all data:", error);
      throw error;
    }
  },

  // Export data (for backup) - Enhanced version
  exportData: async (userId?: string) => {
    try {
      // Get all basic data
      const basicData = {
        users: await getStorageData(KEYS.USERS),
        assets: await getStorageData(KEYS.ASSETS),
        growth: await getStorageData(KEYS.GROWTH),
        goals: await getStorageData(KEYS.GOALS),
        version: "1.1",
        exportDate: new Date().toISOString(),
        appName: "WealthAndAssetManagerMobile",
      };

      // Add budget data for all users or specific user
      const budgetData: any = {};
      if (userId) {
        // Export budget for specific user
        const budget = await AsyncStorage.getItem(`budget_${userId}`);
        if (budget) {
          budgetData[userId] = JSON.parse(budget);
        }
      } else {
        // Export all budget data (for admin/full backup)
        const users = basicData.users || [];
        for (const user of users) {
          const budget = await AsyncStorage.getItem(`budget_${user._id}`);
          if (budget) {
            budgetData[user._id] = JSON.parse(budget);
          }
        }
      }

      const fullData = {
        ...basicData,
        budgets: budgetData,
      };

      return JSON.stringify(fullData, null, 2); // Pretty formatted JSON
    } catch (error) {
      console.error("Error exporting data:", error);
      return null;
    }
  },

  // Export data in user-friendly format
  exportUserFriendlyData: async (userId: string) => {
    try {
      const assets = await assetAPI.getAllAssets(userId);
      const goals = await goalAPI.getGoals(userId);
      const growth = await growthAPI.getPortfolioGrowth(userId);
      const budget = await budgetAPI.getBudgetAllocation(userId);

      // Create human-readable export
      const exportData = {
        exportInfo: {
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          version: "1.1",
        },
        portfolio: {
          totalValue: assets.reduce(
            (sum: number, asset: any) => sum + asset.value,
            0
          ),
          totalAssets: assets.length,
          assets: assets.map((asset: any) => ({
            name: asset.name,
            type: asset.type,
            value: asset.value,
            currency: asset.currency,
          })),
        },
        budget: budget
          ? {
              monthlyIncome: budget.monthlyIncome,
              currency: budget.currency,
              allocation: {
                needs: {
                  percentage: budget.needs.percentage,
                  amount: budget.needs.amount,
                  items: budget.needs.items.map((item: any) => ({
                    name: item.name,
                    amount: item.amount,
                    description: item.description,
                  })),
                },
                wants: {
                  percentage: budget.wants.percentage,
                  amount: budget.wants.amount,
                  items: budget.wants.items.map((item: any) => ({
                    name: item.name,
                    amount: item.amount,
                    description: item.description,
                  })),
                },
                savings: {
                  percentage: budget.savings.percentage,
                  amount: budget.savings.amount,
                  items: budget.savings.items.map((item: any) => ({
                    name: item.name,
                    amount: item.amount,
                    description: item.description,
                  })),
                },
              },
            }
          : null,
        goals: goals
          ? {
              shortTermGoals: goals.shortTermGoals || [],
              longTermGoals: goals.longTermGoals || [],
            }
          : null,
        growth: growth.map((g: any) => ({
          month: g.month,
          portfolioValue: g.portfolioValue,
          isInitialValue: g.isInitialValue,
        })),
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error("Error exporting user-friendly data:", error);
      return null;
    }
  },

  // Import data (for restore) - Enhanced version
  importData: async (dataString: string, userId?: string) => {
    try {
      const data = JSON.parse(dataString);

      // Validate data format
      if (!data.version || !data.exportDate) {
        throw new Error("Invalid data format - missing version or export date");
      }

      // Import basic data
      if (data.users) await setStorageData(KEYS.USERS, data.users);
      if (data.assets) await setStorageData(KEYS.ASSETS, data.assets);
      if (data.growth) await setStorageData(KEYS.GROWTH, data.growth);
      if (data.goals) await setStorageData(KEYS.GOALS, data.goals);

      // Import budget data
      if (data.budgets) {
        if (userId && data.budgets[userId]) {
          // Import budget for specific user
          await AsyncStorage.setItem(
            `budget_${userId}`,
            JSON.stringify(data.budgets[userId])
          );
        } else {
          // Import all budget data
          for (const [userBudgetId, budgetData] of Object.entries(
            data.budgets
          )) {
            await AsyncStorage.setItem(
              `budget_${userBudgetId}`,
              JSON.stringify(budgetData)
            );
          }
        }
      }

      return {
        success: true,
        message: "Data imported successfully",
        importedData: {
          users: data.users?.length || 0,
          assets: data.assets?.length || 0,
          growth: data.growth?.length || 0,
          goals: data.goals?.length || 0,
          budgets: Object.keys(data.budgets || {}).length,
        },
      };
    } catch (error) {
      console.error("Error importing data:", error);
      throw new Error(
        `Import failed: ${
          error instanceof Error ? error.message : "Invalid data format"
        }`
      );
    }
  },

  // Backup current data before import
  createBackup: async (userId: string) => {
    try {
      const backupData = await storageUtils.exportData(userId);
      const backupKey = `backup_${userId}_${Date.now()}`;
      await AsyncStorage.setItem(backupKey, backupData || "");
      return backupKey;
    } catch (error) {
      console.error("Error creating backup:", error);
      return null;
    }
  },

  // Restore from backup
  restoreBackup: async (backupKey: string) => {
    try {
      const backupData = await AsyncStorage.getItem(backupKey);
      if (!backupData) {
        throw new Error("Backup not found");
      }
      return await storageUtils.importData(backupData);
    } catch (error) {
      console.error("Error restoring backup:", error);
      throw error;
    }
  },
};
