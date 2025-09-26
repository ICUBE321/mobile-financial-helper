export interface BudgetItem {
  _id: string;
  name: string;
  amount: number;
  category: "needs" | "wants" | "savings";
  description?: string;
}

export interface BudgetAllocation {
  _id: string;
  userId: string;
  monthlyIncome: number;
  needs: {
    amount: number;
    percentage: number;
    items: BudgetItem[];
  };
  wants: {
    amount: number;
    percentage: number;
    items: BudgetItem[];
  };
  savings: {
    amount: number;
    percentage: number;
    items: BudgetItem[];
  };
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetFormData {
  monthlyIncome: string;
  needsPercentage: string;
  wantsPercentage: string;
  savingsPercentage: string;
  currency: string;
}

export interface BudgetItemFormData {
  name: string;
  amount: string;
  category: "needs" | "wants" | "savings";
  description: string;
}
