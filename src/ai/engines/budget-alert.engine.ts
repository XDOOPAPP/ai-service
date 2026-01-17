import { Injectable } from '@nestjs/common';
import { Alert } from '../interfaces/ai-results.interface';

interface Budget {
    id: string;
    name: string;
    limitAmount: number;
    category: string;
    startDate: Date | string;
    endDate: Date | string;
}

interface Expense {
    amount: number;
    category?: string;
    spentAt: Date | string;
}

@Injectable()
export class BudgetAlertEngine {
    generateAlerts(budgets: Budget[], expenses: Expense[]): Alert[] {
        const alerts: Alert[] = [];

        for (const budget of budgets) {
            // Calculate total spending for this budget
            const budgetExpenses = expenses.filter((expense) => {
                const expenseDate = new Date(expense.spentAt);
                const startDate = new Date(budget.startDate);
                const endDate = new Date(budget.endDate);

                return (
                    expense.category === budget.category &&
                    expenseDate >= startDate &&
                    expenseDate <= endDate
                );
            });

            const totalSpent = budgetExpenses.reduce(
                (sum, expense) => sum + expense.amount,
                0,
            );
            const percentage = (totalSpent / budget.limitAmount) * 100;

            // Generate alerts based on percentage
            if (percentage >= 100) {
                // Over budget
                const overAmount = totalSpent - budget.limitAmount;
                alerts.push({
                    budgetId: budget.id,
                    type: 'critical',
                    message: `Vượt ngân sách "${budget.name}": ${overAmount.toLocaleString('vi-VN')} VND (${Math.round(percentage)}%)`,
                    severity: 'critical',
                    percentage: Math.round(percentage),
                });
            } else if (percentage >= 80) {
                // 80% threshold
                const remaining = budget.limitAmount - totalSpent;
                alerts.push({
                    budgetId: budget.id,
                    type: 'danger',
                    message: `Sắp vượt ngân sách "${budget.name}": Còn ${remaining.toLocaleString('vi-VN')} VND (${Math.round(100 - percentage)}%)`,
                    severity: 'danger',
                    percentage: Math.round(percentage),
                });
            } else if (percentage >= 50) {
                // 50% threshold
                alerts.push({
                    budgetId: budget.id,
                    type: 'warning',
                    message: `Đã sử dụng ${Math.round(percentage)}% ngân sách "${budget.name}"`,
                    severity: 'warning',
                    percentage: Math.round(percentage),
                });
            }

            // Projected to exceed
            if (percentage < 100 && percentage > 0) {
                const daysElapsed = this.getDaysElapsed(
                    new Date(budget.startDate),
                    new Date(),
                );
                const totalDays = this.getDaysElapsed(
                    new Date(budget.startDate),
                    new Date(budget.endDate),
                );

                if (daysElapsed > 0 && totalDays > 0) {
                    const dailyRate = totalSpent / daysElapsed;
                    const projectedTotal = dailyRate * totalDays;
                    const projectedPercentage =
                        (projectedTotal / budget.limitAmount) * 100;

                    if (projectedPercentage > 100 && percentage < 80) {
                        alerts.push({
                            budgetId: budget.id,
                            type: 'warning',
                            message: `Dự kiến vượt ngân sách "${budget.name}": ${Math.round(projectedPercentage)}% nếu tiếp tục chi tiêu`,
                            severity: 'warning',
                            percentage: Math.round(percentage),
                        });
                    }
                }
            }
        }

        return alerts;
    }

    private getDaysElapsed(startDate: Date, endDate: Date): number {
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
}
