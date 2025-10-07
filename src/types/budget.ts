export interface BudgetItem {
  _id: string;
  name: string;
  amount: number;
  category: "needs" | "wants" | "savings";
  description?: string;
  createdAt: Date;
}

export interface BudgetAllocation {
  _id: string;
  userId: string;
  monthlyIncome: number;
  needs: {
    amount: number;
    percentage: number;
    items: BudgetItem[];
    spent: number;
  };
  wants: {
    amount: number;
    percentage: number;
    items: BudgetItem[];
    spent: number;
  };
  savings: {
    amount: number;
    percentage: number;
    items: BudgetItem[];
    spent: number;
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
