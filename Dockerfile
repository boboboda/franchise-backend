FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 8080

CMD ["npm", "run", "start:prod"]