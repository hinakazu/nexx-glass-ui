import { IsString, IsNotEmpty, IsInt, IsOptional, IsBoolean, Min, Max, MaxLength } from 'class-validator';

export class CreateRecognitionDto {
  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  message: string;

  @IsInt()
  @Min(1)
  @Max(100) // Assuming max 100 points can be sent in one recognition
  pointsAmount: number;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}