FROM node:18-alpine

WORKDIR /app

# NestJS CLI 전역 설치
RUN npm install -g @nestjs/cli

# 패키지 파일 복사
COPY package*.json ./
COPY prisma ./prisma/

# 의존성 설치
RUN npm ci

# 소스 코드 복사
COPY . .

# Prisma 생성
RUN npx prisma generate

# NestJS 빌드
RUN npm run build

# 포트 노출
EXPOSE 8080

# 애플리케이션 실행11
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
