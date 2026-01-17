import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class DetectAnomaliesDto {
    @IsOptional()
    @IsString()
    from?: string;

    @IsOptional()
    @IsString()
    to?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(5)
    threshold?: number;
}
