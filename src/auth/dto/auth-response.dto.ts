// src/auth/dto/auth-response.dto.ts
export class AuthResponseDto {
  user: {
    id: string;
    email: string;
    name: string;
    phone: string;
    role: string;
    userType: string;
    fcmToken?: string;
    termsAgreed: boolean;
    marketingAgreed: boolean;
    autoLoginState: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  token: string;
}

export class UserResponseDto {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  userType: string;
  fcmToken?: string;
  termsAgreed: boolean;
  marketingAgreed: boolean;
  autoLoginState: boolean;
  createdAt: Date;
  updatedAt: Date;
}