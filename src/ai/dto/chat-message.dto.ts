import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class ChatMessageDto {
    @IsString()
    @IsNotEmpty()
    message: string;

    @IsOptional()
    @IsString()
    conversationId?: string;

    @IsOptional()
    @IsBoolean()
    includeContext?: boolean;
}
