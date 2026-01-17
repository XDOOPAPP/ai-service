import { Injectable } from '@nestjs/common';
import { PredictionResult } from '../interfaces/ai-results.interface';
import * as stats from 'simple-statistics';

interface Expense {
    amount: number;
    spentAt: Date | string;
    category?: string;
}

@Injectable()
export class PredictionEngine {
    predictSpending(
        expenses: Expense[],
        period: 'week' | 'month' | 'year',
        category?: string,
    ): PredictionResult {
        // Filter by category if specified
        let filteredExpenses = expenses;
        if (category) {
            filteredExpenses = expenses.filter((e) => e.category === category);
        }

        if (filteredExpenses.length === 0) {
            return {
                prediction: 0,
                trend: 'stable',
                confidence: 0,
                breakdown: [],
            };
        }

        // Group expenses by period
        const grouped = this.groupByPeriod(filteredExpenses, period);
        const amounts = Object.values(grouped).map((items) =>
            items.reduce((sum, item) => sum + item.amount, 0),
        );

        if (amounts.length === 0) {
            return {
                prediction: 0,
                trend: 'stable',
                confidence: 0,
                breakdown: [],
            };
        }

        // Calculate prediction
        const mean = stats.mean(amounts);
        const median = stats.median(amounts);
        const stdDev = amounts.length > 1 ? stats.standardDeviation(amounts) : 0;

        // Use weighted average of mean and median for prediction
        const prediction = mean * 0.7 + median * 0.3;

        // Calculate trend
        const trend = this.calculateTrend(amounts);

        // Calculate confidence based on data consistency
        const confidence = this.calculateConfidence(amounts, stdDev, mean);

        // Create breakdown
        const breakdown = Object.entries(grouped).map(([period, items]) => ({
            period,
            amount: items.reduce((sum, item) => sum + item.amount, 0),
        }));

        return {
            prediction: Math.round(prediction),
            trend,
            confidence,
            breakdown: breakdown.slice(-6), // Last 6 periods
        };
    }

    private groupByPeriod(
        expenses: Expense[],
        period: 'week' | 'month' | 'year',
    ): { [key: string]: Expense[] } {
        const grouped: { [key: string]: Expense[] } = {};

        for (const expense of expenses) {
            const date = new Date(expense.spentAt);
            let key: string;

            switch (period) {
                case 'week':
                    const weekNum = this.getWeekNumber(date);
                    key = `${date.getFullYear()}-W${weekNum}`;
                    break;
                case 'month':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    break;
                case 'year':
                    key = `${date.getFullYear()}`;
                    break;
            }

            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(expense);
        }

        return grouped;
    }

    private getWeekNumber(date: Date): number {
        const d = new Date(
            Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
        );
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    }

    private calculateTrend(
        data: number[],
    ): 'increasing' | 'decreasing' | 'stable' {
        if (data.length < 2) return 'stable';

        // Simple linear regression
        const n = data.length;
        const indices = Array.from({ length: n }, (_, i) => i);

        try {
            const regression = stats.linearRegression(
                indices.map((i, idx) => [i, data[idx]]),
            );
            const slope = regression.m;

            if (slope > 0.05) return 'increasing';
            if (slope < -0.05) return 'decreasing';
            return 'stable';
        } catch {
            return 'stable';
        }
    }

    private calculateConfidence(
        amounts: number[],
        stdDev: number,
        mean: number,
    ): number {
        if (amounts.length < 2) return 0.3;

        // Coefficient of variation
        const cv = mean > 0 ? stdDev / mean : 1;

        // Lower CV = higher confidence
        let confidence = 1 - Math.min(cv, 1);

        // Adjust based on sample size
        const sampleSizeFactor = Math.min(amounts.length / 12, 1);
        confidence = confidence * 0.7 + sampleSizeFactor * 0.3;

        return Math.max(0.1, Math.min(0.95, confidence));
    }
}
