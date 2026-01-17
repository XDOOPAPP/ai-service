import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CategorizationEngine } from './engines/categorization.engine';
import { PredictionEngine } from './engines/prediction.engine';
import { AnomalyEngine } from './engines/anomaly.engine';
import { BudgetAlertEngine } from './engines/budget-alert.engine';
import { GeminiService } from './integrations/gemini.service';

@Module({
  imports: [
    PrismaModule,
    ClientsModule.register([
      {
        name: 'EXPENSE_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'expense_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        name: 'BUDGET_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'budget_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [AiController],
  providers: [
    AiService,
    CategorizationEngine,
    PredictionEngine,
    AnomalyEngine,
    BudgetAlertEngine,
    GeminiService,
  ],
})
export class AiModule { }
