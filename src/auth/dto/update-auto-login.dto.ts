// src/auth/dto/update-auto-login.dto.ts
import { IsBoolean } from 'class-validator';

export class UpdateAutoLoginDto {
  @IsBoolean({ message: '자동 로그인 상태는 boolean 값이어야 합니다' })
  autoLoginState: boolean;
}