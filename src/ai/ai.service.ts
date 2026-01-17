import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { CategorizationEngine } from './engines/categorization.engine';
import { PredictionEngine } from './engines/prediction.engine';
import { AnomalyEngine } from './engines/anomaly.engine';
import { BudgetAlertEngine } from './engines/budget-alert.engine';
import { GeminiService } from './integrations/gemini.service';
import { CategorizeExpenseDto } from './dto/categorize-expense.dto';
import { PredictSpendingDto } from './dto/predict-spending.dto';
import { ChatMessageDto } from './dto/chat-message.dto';
import { DetectAnomaliesDto } from './dto/detect-anomalies.dto';
import { UserFinancialContext } from './interfaces/user-context.interface';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);

    constructor(
        @Inject('EXPENSE_SERVICE') private expenseClient: ClientProxy,
        @Inject('BUDGET_SERVICE') private budgetClient: ClientProxy,
        private prisma: PrismaService,
        private categorizationEngine: CategorizationEngine,
        private predictionEngine: PredictionEngine,
        private anomalyEngine: AnomalyEngine,
        private budgetAlertEngine: BudgetAlertEngine,
        private geminiService: GeminiService,
    ) { }

    // ========== CATEGORIZATION ==========
    async categorizeExpense(dto: CategorizeExpenseDto, userId: string) {
        this.logger.log(`Categorizing expense for user ${userId}`);

        const result = this.categorizationEngine.categorize(
            dto.description,
            dto.amount,
        );

        return {
            success: true,
            data: result,
        };
    }

    // ========== SPENDING PREDICTION ==========
    async predictSpending(dto: PredictSpendingDto, userId: string) {
        this.logger.log(`Predicting spending for user ${userId}`);

        try {
            // Fetch user expenses from expense-service
            const expensesResponse = await firstValueFrom(
                this.expenseClient.send('expense.findAll', { userId }),
            );

            const expenses = expensesResponse.data || [];

            const result = this.predictionEngine.predictSpending(
                expenses,
                dto.period,
                dto.category,
            );

            return {
                success: true,
                data: result,
            };
        } catch (error) {
            this.logger.error('Error predicting spending:', error);
            return {
                success: false,
                message: 'Không thể dự đoán chi tiêu. Vui lòng thử lại sau.',
            };
        }
    }

    // ========== ANOMALY DETECTION ==========
    async detectAnomalies(dto: DetectAnomaliesDto, userId: string) {
        this.logger.log(`Detecting anomalies for user ${userId}`);

        try {
            // Fetch user expenses
            const query: any = { userId };
            if (dto.from) query.from = dto.from;
            if (dto.to) query.to = dto.to;
            if (dto.category) query.category = dto.category;

            const expensesResponse = await firstValueFrom(
                this.expenseClient.send('expense.findAll', query),
            );

            const expenses = expensesResponse.data || [];
            const threshold = dto.threshold || 2.5;

            const anomalies = this.anomalyEngine.detectAnomalies(expenses, threshold);

            return {
                success: true,
                data: {
                    anomalies,
                    total: anomalies.length,
                },
            };
        } catch (error) {
            this.logger.error('Error detecting anomalies:', error);
            return {
                success: false,
                message: 'Không thể phát hiện bất thường. Vui lòng thử lại sau.',
            };
        }
    }

    // ========== BUDGET ALERTS ==========
    async generateBudgetAlerts(userId: string) {
        this.logger.log(`Generating budget alerts for user ${userId}`);

        try {
            // Fetch budgets
            const budgetsResponse = await firstValueFrom(
                this.budgetClient.send('budget.find_all', { userId }),
            );

            // Fetch expenses
            const expensesResponse = await firstValueFrom(
                this.expenseClient.send('expense.findAll', { userId }),
            );

            const budgets = budgetsResponse.data || [];
            const expenses = expensesResponse.data || [];

            const alerts = this.budgetAlertEngine.generateAlerts(budgets, expenses);

            return {
                success: true,
                data: {
                    alerts,
                    total: alerts.length,
                },
            };
        } catch (error) {
            this.logger.error('Error generating budget alerts:', error);
            return {
                success: false,
                message: 'Không thể tạo cảnh báo ngân sách. Vui lòng thử lại sau.',
            };
        }
    }

    // ========== AI ASSISTANT CHAT ==========
    async chatWithAssistant(dto: ChatMessageDto, userId: string) {
        this.logger.log(`AI chat for user ${userId}`);

        try {
            // Build context if requested
            let context: UserFinancialContext | undefined;
            if (dto.includeContext !== false) {
                context = await this.buildUserContext(userId);
            }

            // Get AI response
            const response = await this.geminiService.chat(dto.message, context);

            // Save conversation
            let conversationId = dto.conversationId;
            if (!conversationId) {
                const conversation = await this.prisma.conversation.create({
                    data: { userId },
                });
                conversationId = conversation.id;
            }

            // Save messages
            await this.prisma.message.createMany({
                data: [
                    {
                        conversationId,
                        role: 'user',
                        content: dto.message,
                    },
                    {
                        conversationId,
                        role: 'assistant',
                        content: response,
                    },
                ],
            });

            return {
                success: true,
                data: {
                    response,
                    conversationId,
                },
            };
        } catch (error) {
            this.logger.error('Error in AI chat:', error);
            return {
                success: false,
                message: 'Không thể kết nối với AI Assistant. Vui lòng thử lại sau.',
            };
        }
    }

    // ========== GET INSIGHTS ==========
    async getInsights(userId: string, period?: string) {
        this.logger.log(`Getting insights for user ${userId}`);

        try {
            const insights: Array<{
                type: string;
                title: string;
                description: string;
                data: any;
            }> = [];

            // Get spending prediction
            const prediction = await this.predictSpending(
                { period: 'month' } as any,
                userId,
            );
            if (prediction.success && prediction.data) {
                insights.push({
                    type: 'prediction',
                    title: 'Dự đoán chi tiêu tháng tới',
                    description: `Dự kiến chi tiêu: ${prediction.data.prediction.toLocaleString('vi-VN')} VND`,
                    data: prediction.data,
                });
            }

            // Get anomalies
            const anomalies = await this.detectAnomalies({} as any, userId);
            if (anomalies.success && anomalies.data && anomalies.data.total > 0) {
                insights.push({
                    type: 'anomalies',
                    title: 'Phát hiện bất thường',
                    description: `Tìm thấy ${anomalies.data.total} giao dịch bất thường`,
                    data: anomalies.data,
                });
            }

            // Get budget alerts
            const alerts = await this.generateBudgetAlerts(userId);
            if (alerts.success && alerts.data && alerts.data.total > 0) {
                insights.push({
                    type: 'alerts',
                    title: 'Cảnh báo ngân sách',
                    description: `Có ${alerts.data.total} cảnh báo cần chú ý`,
                    data: alerts.data,
                });
            }

            return {
                success: true,
                data: {
                    insights,
                    total: insights.length,
                },
            };
        } catch (error) {
            this.logger.error('Error getting insights:', error);
            return {
                success: false,
                message: 'Không thể lấy insights. Vui lòng thử lại sau.',
            };
        }
    }

    // ========== HELPER METHODS ==========
    private async buildUserContext(
        userId: string,
    ): Promise<UserFinancialContext> {
        try {
            // Fetch expenses
            const expensesResponse = await firstValueFrom(
                this.expenseClient.send('expense.findAll', { userId }),
            );
            const expenses = expensesResponse.data || [];

            // Fetch budgets
            const budgetsResponse = await firstValueFrom(
                this.budgetClient.send('budget.find_all', { userId }),
            );
            const budgets = budgetsResponse.data || [];

            // Calculate total expenses
            const totalExpenses = expenses.reduce(
                (sum, e) => sum + (e.amount || 0),
                0,
            );

            // Get top categories
            const categoryTotals = {};
            expenses.forEach((e) => {
                const cat = e.category || 'other';
                categoryTotals[cat] = (categoryTotals[cat] || 0) + e.amount;
            });
            const topCategories = Object.entries(categoryTotals)
                .sort((a: any, b: any) => b[1] - a[1])
                .slice(0, 3)
                .map((entry) => entry[0]);

            // Budget status
            const budgetStatus =
                budgets.length > 0
                    ? `Có ${budgets.length} ngân sách đang hoạt động`
                    : 'Chưa có ngân sách';

            // Recent expenses
            const recentExpenses = expenses
                .slice(0, 5)
                .map((e) => ({
                    description: e.description,
                    amount: e.amount,
                    category: e.category || 'other',
                    date: e.spentAt,
                }));

            return {
                userId,
                totalExpenses,
                budgetStatus,
                topCategories,
                recentExpenses,
            };
        } catch (error) {
            this.logger.error('Error building user context:', error);
            return {
                userId,
                totalExpenses: 0,
                budgetStatus: 'Không có dữ liệu',
                topCategories: [],
                recentExpenses: [],
            };
        }
    }
}
