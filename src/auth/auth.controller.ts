// src/auth/auth.controller.ts
import { 
 Controller, 
 Post, 
 Get, 
 Body, 
 UseGuards, 
 Request, 
 Patch,
 HttpCode,
 HttpStatus 
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateFcmTokenDto } from './dto/update-fcm-token.dto';
import { UpdateAutoLoginDto } from './dto/update-auto-login.dto';

@Controller('auth')
export class AuthController {
 constructor(private authService: AuthService) {}

 @Post('signup')
 @HttpCode(HttpStatus.CREATED)
 async signUp(@Body() signUpDto: SignUpDto) {
   const result = await this.authService.signUp(signUpDto);
   return {
     success: true,
     message: '회원가입이 완료되었습니다',
     data: result
   };
 }

 @Post('login')
 @HttpCode(HttpStatus.OK)
 async login(@Body() loginDto: LoginDto) {
   const result = await this.authService.login(loginDto);
   return {
     success: true,
     message: '로그인이 완료되었습니다',
     data: result
   };
 }

 @Post('logout')
 @UseGuards(AuthGuard('jwt'))
 @HttpCode(HttpStatus.OK)
 async logout(@Request() req) {
   // 클라이언트에서 토큰을 삭제하도록 안내
   // 필요시 토큰 블랙리스트 처리 로직 추가
   return {
     success: true,
     message: '로그아웃이 완료되었습니다'
   };
 }
 //d//

 @Get('me')
 @UseGuards(AuthGuard('jwt'))
 async getCurrentUser(@Request() req) {
   const user = await this.authService.getCurrentUser(req.user.userId);
   return {
     success: true,
     message: '사용자 정보 조회 성공',
     data: { user }
   };
 }

 @Patch('fcm-token')
 @UseGuards(AuthGuard('jwt'))
 @HttpCode(HttpStatus.OK)
 async updateFcmToken(@Request() req, @Body() updateFcmTokenDto: UpdateFcmTokenDto) {
   await this.authService.updateFcmToken(req.user.userId, updateFcmTokenDto.fcmToken);
   return {
     success: true,
     message: 'FCM 토큰이 업데이트되었습니다'
   };
 }

 @Patch('auto-login')
 @UseGuards(AuthGuard('jwt'))
 @HttpCode(HttpStatus.OK)
 async updateAutoLoginState(@Request() req, @Body() updateAutoLoginDto: UpdateAutoLoginDto) {
   await this.authService.updateAutoLoginState(req.user.userId, updateAutoLoginDto.autoLoginState);
   return {
     success: true,
     message: '자동 로그인 설정이 업데이트되었습니다'
   };
 }

 @Get('check-token')
 @UseGuards(AuthGuard('jwt'))
 async checkToken(@Request() req) {
   return {
     success: true,
     message: '토큰이 유효합니다',
     data: {
       userId: req.user.userId,
       email: req.user.email
     }
   };
 }
}