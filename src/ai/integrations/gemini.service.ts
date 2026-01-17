import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { UserFinancialContext } from '../interfaces/user-context.interface';

@Injectable()
export class GeminiService {
    private readonly logger = new Logger(GeminiService.name);
    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        const modelName =
            this.configService.get<string>('GEMINI_MODEL') ||
            'gemini-2.0-flash-exp';

        if (!apiKey) {
            this.logger.warn(
                'GEMINI_API_KEY not configured. AI Assistant will not work.',
            );
            return;
        }

        try {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: modelName });
            this.logger.log(`Gemini AI initialized with model: ${modelName}`);
        } catch (error) {
            this.logger.error('Failed to initialize Gemini AI:', error);
        }
    }

    async chat(
        message: string,
        context?: UserFinancialContext,
    ): Promise<string> {
        if (!this.model) {
            return 'Xin lỗi, AI Assistant chưa được cấu hình. Vui lòng liên hệ quản trị viên.';
        }

        try {
            const prompt = this.buildPrompt(message, context);
            const result = await this.model.generateContent(prompt);
            const response = result.response;
            return response.text();
        } catch (error) {
            this.logger.error('Gemini API error:', error);
            return 'Xin lỗi, đã có lỗi xảy ra khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.';
        }
    }

    private buildPrompt(
        message: string,
        context?: UserFinancialContext,
    ): string {
        let prompt = `Bạn là trợ lý tài chính cá nhân thông minh cho ứng dụng quản lý chi tiêu FEPA (Financial Expense Personal Assistant).

Nhiệm vụ của bạn:
- Tư vấn về quản lý chi tiêu và ngân sách
- Đưa ra lời khuyên thực tế, dễ hiểu
- Trả lời bằng tiếng Việt, ngắn gọn và súc tích
- Tập trung vào hành động cụ thể người dùng có thể làm ngay

`;

        if (context) {
            prompt += `Thông tin tài chính của người dùng:
- Tổng chi tiêu tháng này: ${context.totalExpenses.toLocaleString('vi-VN')} VND
- Trạng thái ngân sách: ${context.budgetStatus}
- Danh mục chi tiêu nhiều nhất: ${context.topCategories.join(', ')}
`;

            if (context.recentExpenses && context.recentExpenses.length > 0) {
                prompt += `\nChi tiêu gần đây:\n`;
                context.recentExpenses.slice(0, 5).forEach((expense) => {
                    prompt += `- ${expense.description}: ${expense.amount.toLocaleString('vi-VN')} VND (${expense.category})\n`;
                });
            }

            prompt += '\n';
        }

        prompt += `Câu hỏi của người dùng: ${message}

Hãy trả lời ngắn gọn (tối đa 200 từ), thực tế và hữu ích.`;

        return prompt;
    }
}
