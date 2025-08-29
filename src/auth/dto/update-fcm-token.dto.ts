// src/auth/dto/update-fcm-token.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateFcmTokenDto {
  @IsNotEmpty({ message: 'FCM 토큰은 필수입니다' })
  @IsString()
  fcmToken: string;
}