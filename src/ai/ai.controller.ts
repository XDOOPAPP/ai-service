import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AiService } from './ai.service';
import { CategorizeExpenseDto } from './dto/categorize-expense.dto';
import { PredictSpendingDto } from './dto/predict-spending.dto';
import { ChatMessageDto } from './dto/chat-message.dto';
import { DetectAnomaliesDto } from './dto/detect-anomalies.dto';

@Controller()
export class AiController {
  constructor(private readonly aiService: AiService) { }

  @MessagePattern('ai.categorize_expense')
  async categorizeExpense(
    @Payload() payload: CategorizeExpenseDto & { userId: string },
  ) {
    const { userId, ...dto } = payload;
    return this.aiService.categorizeExpense(dto, userId);
  }

  @MessagePattern('ai.predict_spending')
  async predictSpending(
    @Payload() payload: PredictSpendingDto & { userId: string },
  ) {
    const { userId, ...dto } = payload;
    return this.aiService.predictSpending(dto, userId);
  }

  @MessagePattern('ai.detect_anomalies')
  async detectAnomalies(
    @Payload() payload: DetectAnomaliesDto & { userId: string },
  ) {
    const { userId, ...dto } = payload;
    return this.aiService.detectAnomalies(dto, userId);
  }

  @MessagePattern('ai.budget_alerts')
  async budgetAlerts(@Payload() payload: { userId: string }) {
    return this.aiService.generateBudgetAlerts(payload.userId);
  }

  @MessagePattern('ai.assistant_chat')
  async assistantChat(
    @Payload() payload: ChatMessageDto & { userId: string },
  ) {
    const { userId, ...dto } = payload;
    return this.aiService.chatWithAssistant(dto, userId);
  }

  @MessagePattern('ai.get_insights')
  async getInsights(@Payload() payload: { userId: string; period?: string }) {
    return this.aiService.getInsights(payload.userId, payload.period);
  }
}
