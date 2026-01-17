import { Injectable } from '@nestjs/common';
import { Anomaly } from '../interfaces/ai-results.interface';
import * as stats from 'simple-statistics';

interface Expense {
    id: string;
    amount: number;
    description: string;
    category?: string;
    spentAt: Date | string;
}

@Injectable()
export class AnomalyEngine {
    detectAnomalies(
        expenses: Expense[],
        threshold: number = 2.5,
    ): Anomaly[] {
        const anomalies: Anomaly[] = [];

        if (expenses.length < 3) {
            return anomalies; // Need at least 3 data points
        }

        // 1. Detect amount anomalies using Z-score
        const amountAnomalies = this.detectAmountAnomalies(expenses, threshold);
        anomalies.push(...amountAnomalies);

        // 2. Detect unusual times
        const timeAnomalies = this.detectTimeAnomalies(expenses);
        anomalies.push(...timeAnomalies);

        // 3. Detect duplicate/similar expenses
        const duplicateAnomalies = this.detectDuplicates(expenses);
        anomalies.push(...duplicateAnomalies);

        // 4. Detect category mismatches
        const categoryAnomalies = this.detectCategoryMismatches(expenses);
        anomalies.push(...categoryAnomalies);

        return anomalies;
    }

    private detectAmountAnomalies(
        expenses: Expense[],
        threshold: number,
    ): Anomaly[] {
        const anomalies: Anomaly[] = [];
        const amounts = expenses.map((e) => e.amount);

        if (amounts.length < 3) return anomalies;

        const mean = stats.mean(amounts);
        const stdDev = stats.standardDeviation(amounts);

        for (const expense of expenses) {
            const zScore = Math.abs((expense.amount - mean) / stdDev);

            if (zScore > threshold) {
                const severity =
                    zScore > threshold * 1.5
                        ? 'high'
                        : zScore > threshold * 1.2
                            ? 'medium'
                            : 'low';

                anomalies.push({
                    expense,
                    reason: `Chi tiêu bất thường: ${expense.amount.toLocaleString('vi-VN')} VND (cao hơn ${Math.round(zScore)} lần độ lệch chuẩn)`,
                    severity,
                    score: zScore,
                });
            }
        }

        return anomalies;
    }

    private detectTimeAnomalies(expenses: Expense[]): Anomaly[] {
        const anomalies: Anomaly[] = [];

        for (const expense of expenses) {
            const date = new Date(expense.spentAt);
            const hour = date.getHours();

            // Unusual hours (midnight to 5 AM)
            if (hour >= 0 && hour < 5) {
                anomalies.push({
                    expense,
                    reason: `Chi tiêu vào giờ bất thường: ${hour}:00`,
                    severity: 'low',
                    score: 1.5,
                });
            }
        }

        return anomalies;
    }

    private detectDuplicates(expenses: Expense[]): Anomaly[] {
        const anomalies: Anomaly[] = [];
        const seen = new Map<string, Expense>();

        for (const expense of expenses) {
            const key = `${expense.amount}-${expense.description}-${new Date(expense.spentAt).toDateString()}`;

            if (seen.has(key)) {
                anomalies.push({
                    expense,
                    reason: `Chi tiêu trùng lặp: "${expense.description}" - ${expense.amount.toLocaleString('vi-VN')} VND`,
                    severity: 'medium',
                    score: 2.0,
                });
            } else {
                seen.set(key, expense);
            }
        }

        return anomalies;
    }

    private detectCategoryMismatches(expenses: Expense[]): Anomaly[] {
        const anomalies: Anomaly[] = [];

        // Category-specific amount thresholds
        const categoryThresholds = {
            food: 500000, // 500k VND
            transport: 300000, // 300k VND
            utilities: 2000000, // 2M VND
        };

        for (const expense of expenses) {
            if (!expense.category) continue;

            const threshold = categoryThresholds[expense.category];
            if (threshold && expense.amount > threshold) {
                anomalies.push({
                    expense,
                    reason: `Chi tiêu cao bất thường cho danh mục "${expense.category}": ${expense.amount.toLocaleString('vi-VN')} VND`,
                    severity: 'medium',
                    score: 2.5,
                });
            }

            // Check for very small amounts in unusual categories
            if (
                expense.amount < 1000 &&
                ['shopping', 'entertainment'].includes(expense.category)
            ) {
                anomalies.push({
                    expense,
                    reason: `Chi tiêu quá nhỏ cho danh mục "${expense.category}": ${expense.amount.toLocaleString('vi-VN')} VND`,
                    severity: 'low',
                    score: 1.2,
                });
            }
        }

        return anomalies;
    }
}
