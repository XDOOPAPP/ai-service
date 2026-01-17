export interface CategoryResult {
    category: string;
    confidence: number;
    suggestedCategories: Array<{
        category: string;
        confidence: number;
    }>;
}

export interface PredictionResult {
    prediction: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    confidence: number;
    breakdown: Array<{
        period: string;
        amount: number;
    }>;
}

export interface Anomaly {
    expense: any;
    reason: string;
    severity: 'low' | 'medium' | 'high';
    score: number;
}

export interface Alert {
    budgetId: string;
    type: 'info' | 'warning' | 'danger' | 'critical';
    message: string;
    severity: string;
    percentage?: number;
}
