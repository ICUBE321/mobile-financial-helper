export const Colors = {
  primary: "#3b82f6", // blue-600
  primaryDark: "#2563eb", // blue-800
  background: "#ffffff",
  text: "#1f2937", // gray-800
  textLight: "#6b7280", // gray-500
  error: "#ef4444", // red-500
  success: "#22c55e", // green-500
  border: "#e5e7eb", // gray-200
};

export const Typography = {
  heading1: {
    fontSize: 28,
    fontWeight: "bold" as const,
  },
  heading2: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  heading3: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
  },
  bodySmall: {
    fontSize: 14,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
};
