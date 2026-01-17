export interface UserFinancialContext {
    userId: string;
    totalExpenses: number;
    budgetStatus: string;
    topCategories: string[];
    recentExpenses: Array<{
        description: string;
        amount: number;
        category: string;
        date: string;
    }>;
    savingsRate?: number;
    monthlyIncome?: number;
}
