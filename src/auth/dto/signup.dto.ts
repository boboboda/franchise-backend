// src/auth/dto/signup.dto.ts
import { IsEmail, IsNotEmpty, IsEnum, IsBoolean, IsOptional, MinLength, IsString } from 'class-validator';

export enum UserType {
  ENTREPRENEUR = 'ENTREPRENEUR',
  CONSULTANT = 'CONSULTANT'
}

export class SignUpDto {
  @IsEmail({}, { message: '올바른 이메일 형식을 입력해주세요' })
  email: string;

  @IsNotEmpty({ message: '비밀번호는 필수입니다' })
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다' })
  password: string;

  @IsNotEmpty({ message: '이름은 필수입니다' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: '전화번호는 필수입니다' })
  @IsString()
  phone: string;

  @IsEnum(UserType, { message: '올바른 사용자 타입을 선택해주세요' })
  userType: UserType;

  @IsBoolean({ message: '약관 동의는 필수입니다' })
  termsAgreed: boolean;

  @IsOptional()
  @IsBoolean()
  marketingAgreed?: boolean = false;
}