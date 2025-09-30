FROM node:18-alpine

WORKDIR /app

RUN npm install -g @nestjs/cli

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npm run build

EXPOSE 8080

CMD ["sh", "-c", "npm run prisma:deploy && npm run start:prod"]