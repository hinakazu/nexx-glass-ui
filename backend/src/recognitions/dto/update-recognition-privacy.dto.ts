import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateRecognitionPrivacyDto {
  @IsBoolean()
  @IsNotEmpty()
  isPrivate: boolean;
}