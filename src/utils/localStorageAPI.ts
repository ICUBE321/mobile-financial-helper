import AsyncStorage from "@react-native-async-storage/async-storage";

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

// Budget APIs using local storage
import { BudgetAllocation } from '../types/budget';

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
      const updatedBudget: BudgetAllocation = {
        ...budget,
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
};

// Utility functions for data management
export const storageUtils = {
  // Clear all app data (useful for logout or reset)
  clearAllData: async () => {
    try {
      await AsyncStorage.multiRemove([
        KEYS.USERS,
        KEYS.ASSETS,
        KEYS.GROWTH,
        KEYS.USER_COUNTER,
        KEYS.ASSET_COUNTER,
        KEYS.GROWTH_COUNTER,
        "token",
        "userId",
      ]);
    } catch (error) {
      console.error("Error clearing data:", error);
    }
  },

  // Export data (for backup)
  exportData: async () => {
    try {
      const data = {
        users: await getStorageData(KEYS.USERS),
        assets: await getStorageData(KEYS.ASSETS),
        growth: await getStorageData(KEYS.GROWTH),
      };
      return JSON.stringify(data);
    } catch (error) {
      console.error("Error exporting data:", error);
      return null;
    }
  },

  // Import data (for restore)
  importData: async (dataString: string) => {
    try {
      const data = JSON.parse(dataString);
      await setStorageData(KEYS.USERS, data.users || []);
      await setStorageData(KEYS.ASSETS, data.assets || []);
      await setStorageData(KEYS.GROWTH, data.growth || []);
    } catch (error) {
      console.error("Error importing data:", error);
      throw new Error("Invalid data format");
    }
  },
};
