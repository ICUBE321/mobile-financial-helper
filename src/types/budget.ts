export interface BudgetAllocation {
  _id: string;
  userId: string;
  monthlyIncome: number;
  needs: {
    amount: number;
    percentage: number;
  };
  wants: {
    amount: number;
    percentage: number;
  };
  savings: {
    amount: number;
    percentage: number;
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
