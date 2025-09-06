import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${JSON.parse(token)}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("userId");
      // Navigate to login (implement navigation logic)
    }
    return Promise.reject(error);
  }
);

// Asset APIs
export const assetAPI = {
  getAllAssets: async (userId: string) => {
    const response = await api.get("/assettracker/all", {
      params: { userId },
    });
    return response.data;
  },

  addAsset: async (asset: any, userId: string) => {
    const response = await api.post("/assettracker", { inputs: asset, userId });
    return response.data;
  },

  updateAsset: async (assetId: string, asset: any) => {
    const response = await api.put(`/assettracker/${assetId}`, asset);
    return response.data;
  },

  deleteAsset: async (assetId: string) => {
    const response = await api.delete(`/assettracker/${assetId}`);
    return response.data;
  },
};

// Auth APIs
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post("/userAuth/login", { email, password });
    return response.data;
  },

  signup: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => {
    const response = await api.post("/userAuth/create", userData);
    return response.data;
  },
};

// Growth Monitoring APIs
export const growthAPI = {
  getPortfolioGrowth: async (userId: string) => {
    const response = await api.get("/monitorGrowth", {
      params: { userId },
    });
    return response.data;
  },

  addPortfolioValue: async (data: {
    portfolioValue: number;
    month: string;
    isInitialValue: boolean;
    userId: string;
  }) => {
    const response = await api.post("/monitorGrowth/manual-add", data);
    return response.data;
  },
};

export default api;
