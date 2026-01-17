import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CategorizeExpenseDto {
    @IsString()
    @IsNotEmpty()
    description: string;

    @IsNumber()
    amount: number;

    @IsOptional()
    @IsString()
    spentAt?: string;

    @IsOptional()
    @IsString()
    merchantName?: string;
}
