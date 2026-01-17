import { IsString, IsEnum, IsOptional } from 'class-validator';

export enum PredictionPeriod {
    WEEK = 'week',
    MONTH = 'month',
    YEAR = 'year',
}

export class PredictSpendingDto {
    @IsOptional()
    @IsString()
    category?: string;

    @IsEnum(PredictionPeriod)
    period: PredictionPeriod;

    @IsOptional()
    @IsString()
    startDate?: string;
}
