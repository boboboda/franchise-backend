// src/auth/auth.service.ts
import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    const { email, password, ...userData } = signUpDto;

    // 이메일 중복 체크
    const existingUser = await this.prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new ConflictException('이미 존재하는 이메일입니다');
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        ...userData,
        autoLoginState: true,
      },
    });

    // JWT 토큰 생성
    const token = this.generateToken(user);

    // 비밀번호 제거 후 반환
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password, autoLogin } = loginDto;

    // 사용자 찾기
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    // 자동 로그인 상태 업데이트
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { autoLoginState: autoLogin ?? user.autoLoginState }
    });

    // JWT 토큰 생성
    const token = this.generateToken(updatedUser);

    // 비밀번호 제거 후 반환
    const { password: _, ...userWithoutPassword } = updatedUser;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다');
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateFcmToken(userId: string, fcmToken: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { fcmToken }
    });
  }

  async updateAutoLoginState(userId: string, autoLoginState: boolean) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { autoLoginState }
    });
  }

  private generateToken(user: any): string {
    const payload = {
      userId: user.id,
      email: user.email,
    };

    return this.jwtService.sign(payload);
  }
}